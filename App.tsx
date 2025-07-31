
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Loader2, UploadCloud, FileText, Scissors, Download, XCircle, CheckSquare, Square } from './components/icons';

// Since libraries are loaded from a CDN, we need to tell TypeScript about their existence on the window object.
declare global {
  interface Window {
    PDFLib: any;
    pdfjsLib: any;
  }
}

type AppState = 'idle' | 'processing' | 'ready' | 'splitting' | 'error';

const PagePreview = ({ pdfDoc, pageNumber, isSelected, onSelect }: { pdfDoc: any, pageNumber: number, isSelected: boolean, onSelect: (page: number) => void; }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;
        
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
      } catch (error) {
        console.error(`Failed to render page ${pageNumber}`, error);
      }
    };
    renderPage();
    return () => { isCancelled = true; };
  }, [pdfDoc, pageNumber]);

  return (
    <div
      onClick={() => onSelect(pageNumber)}
      className="relative aspect-[3/4] group rounded-lg overflow-hidden cursor-pointer transition-all duration-200 shadow-md bg-muted select-none"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select page ${pageNumber}`}
    >
      <canvas ref={canvasRef} className="w-full h-full object-contain bg-white" />
      <div className={`absolute inset-0 transition-all duration-200 border-4 ${isSelected ? 'border-primary' : 'border-transparent group-hover:border-primary/50'}`} />
      <div className="absolute top-2 right-2">
        {isSelected 
          ? <CheckSquare className="w-6 h-6 text-primary bg-background/80 backdrop-blur-sm rounded-md p-0.5" /> 
          : <Square className="w-6 h-6 text-muted-foreground bg-background/50 backdrop-blur-sm rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
       <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end">
        <span className="text-white text-sm font-bold drop-shadow-lg">Page {pageNumber}</span>
      </div>
    </div>
  );
};

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [appState, setAppState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      await processPdf(file);
    } else {
      handleError('Please select a valid PDF file.');
    }
    event.target.value = '';
  };
  
  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      await processPdf(file);
    } else {
      handleError('Please drop a valid PDF file.');
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processPdf = useCallback(async (file: File) => {
    setAppState('processing');
    setSelectedPages(new Set());
    setPageCount(0);
    setPdfDoc(null);
    setErrorMessage('');

    try {
      if (!window.pdfjsLib) {
          handleError('PDF viewer library not loaded. Please refresh the page.');
          return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      setPdfDoc(pdfjsDoc);
      setPageCount(pdfjsDoc.numPages);
      setAppState('ready');
    } catch (err: any) {
      console.error(err);
      const message = err.name === 'PasswordException'
        ? 'The PDF file is password-protected and cannot be opened.'
        : 'Failed to process the PDF. It might be corrupted or in an invalid format.';
      handleError(message);
    }
  }, []);

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(pageNumber)) {
        newSelection.delete(pageNumber);
      } else {
        newSelection.add(pageNumber);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const allPages = new Set(Array.from({ length: pageCount }, (_, i) => i + 1));
    setSelectedPages(allPages);
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleSelectRange = () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);

    if (
        !rangeFrom ||
        !rangeTo ||
        isNaN(from) ||
        isNaN(to) ||
        from < 1 ||
        to > pageCount ||
        from > to
    ) {
        // Silently fail on invalid range. Button is disabled for most cases.
        // This is a safety net for edge cases like manually typing invalid values.
        return;
    }

    const newSelection = new Set(selectedPages);
    for (let i = from; i <= to; i++) {
        newSelection.add(i);
    }
    setSelectedPages(newSelection);
    setRangeFrom('');
    setRangeTo('');
  };


  const handleSplitPdf = async () => {
    if (!pdfFile || selectedPages.size === 0) {
      handleError('No pages selected. Please select at least one page to split.');
      return;
    }

    setAppState('splitting');
    setErrorMessage('');

    try {
      if (!window.PDFLib) {
        handleError('PDF splitting library not loaded. Please refresh the page.');
        return;
      }
      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const sortedSelectedPages = Array.from(selectedPages).sort((a, b) => a - b);

      const copiedPages = await newPdf.copyPages(originalPdf, sortedSelectedPages.map(p => p - 1));
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const originalFileName = pdfFile.name.replace(/\.pdf$/i, '');
      link.download = `${originalFileName}_split.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setAppState('ready');
    } catch (err) {
      console.error(err);
      handleError('An error occurred while splitting the PDF.');
    }
  };

  const handleError = (message: string) => {
    setPdfFile(null);
    setAppState('error');
    setErrorMessage(message);
  };
  
  const resetState = () => {
      setPdfFile(null);
      setPdfDoc(null);
      setPageCount(0);
      setSelectedPages(new Set());
      setAppState('idle');
      setErrorMessage('');
      setRangeFrom('');
      setRangeTo('');
  }

  const pages = useMemo(() => Array.from({ length: pageCount }, (_, i) => i + 1), [pageCount]);

  const renderContent = () => {
    switch (appState) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg">Processing your PDF...</p>
            <p className="text-sm">This may take a moment for large files.</p>
          </div>
        );
      case 'splitting':
         return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg">Splitting & Preparing Download...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg p-4 text-center border border-destructive/30">
            <XCircle className="w-12 h-12 mb-4 text-destructive" />
            <p className="font-semibold text-foreground">An Error Occurred</p>
            <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
            <Button variant="destructive" className="mt-6" onClick={resetState}>Try Again</Button>
          </div>
        );
      case 'ready':
        return (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 max-h-[50vh] overflow-y-auto p-2 bg-secondary/20 rounded-lg">
            {pages.map(pageNumber => (
              <PagePreview
                key={pageNumber}
                pdfDoc={pdfDoc}
                pageNumber={pageNumber}
                isSelected={selectedPages.has(pageNumber)}
                onSelect={togglePageSelection}
              />
            ))}
          </div>
        );
      case 'idle':
      default:
        return (
            <label 
              htmlFor="pdf-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-lg font-semibold text-foreground">Drop your PDF here</p>
                    <p className="text-muted-foreground">or <span className="font-medium text-primary">browse files</span> on your computer</p>
                </div>
                <Input id="pdf-upload" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
            </label>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 font-sans">
      <Card className="w-full max-w-5xl shadow-lg bg-background">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Scissors className="w-6 h-6 mr-3 text-primary" />
                PDF Page Splitter
              </CardTitle>
              <CardDescription className="mt-1">Upload a PDF, select pages, and download a new file.</CardDescription>
            </div>
             {pdfFile && (
              <Button variant="outline" size="sm" onClick={resetState}>
                <XCircle className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
          {pdfFile && (appState === 'ready' || appState === 'splitting') && (
            <div className="pt-4 flex items-center space-x-4 border-t border-border mt-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate" title={pdfFile.name}>{pdfFile.name}</p>
                <p className="text-sm text-muted-foreground">{pageCount} pages found</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {(appState === 'ready' || appState === 'splitting') && (
          <CardFooter className="flex flex-col lg:flex-row justify-between items-center gap-4 border-t border-border pt-6 mt-2">
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-4 gap-y-2">
                {/* Bulk selection */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button variant="secondary" onClick={handleSelectAll}>Select All</Button>
                    <Button variant="secondary" onClick={handleDeselectAll}>Deselect None</Button>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-border hidden md:block"></div>

                {/* Range selection */}
                <div className="flex items-center space-x-2">
                    <Input
                        type="number"
                        placeholder="From"
                        className="w-24"
                        value={rangeFrom}
                        onChange={e => setRangeFrom(e.target.value)}
                        min="1"
                        max={pageCount}
                        aria-label="Start page for range selection"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="number"
                        placeholder="To"
                        className="w-24"
                        value={rangeTo}
                        onChange={e => setRangeTo(e.target.value)}
                        min={rangeFrom || 1}
                        max={pageCount}
                        aria-label="End page for range selection"
                    />
                    <Button variant="secondary" onClick={handleSelectRange} disabled={!rangeFrom || !rangeTo}>Add Range</Button>
                </div>
            </div>
            
            <div className="flex-shrink-0 w-full lg:w-auto">
                <Button 
                    onClick={handleSplitPdf} 
                    disabled={selectedPages.size === 0 || appState === 'splitting'}
                    className="w-full text-base"
                    size="lg"
                >
                  {appState === 'splitting' ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-5 w-5" />
                  )}
                  Split & Download ({selectedPages.size} Selected)
                </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
