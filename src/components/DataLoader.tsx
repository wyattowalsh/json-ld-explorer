import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

// Icons
import {
  Upload, FileText, Link, Code, Check, X, AlertCircle,
  Loader2, Download, Copy, Eye, EyeOff, Sparkles, CheckCircle
} from 'lucide-react';

// Default URL for auto-loading
const DEFAULT_URL = 'https://gist.githubusercontent.com/wyattowalsh/f60976c79f7b904fea81cb9b97dd8c3c/raw/career.jsonld';

interface DataLoaderProps {
  onDataLoad: (data: object) => void;
  onError?: (error: string) => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount?: number;
  linkCount?: number;
}

export function DataLoader({ onDataLoad, onError }: DataLoaderProps) {
  const [activeTab, setActiveTab] = useState('paste');
  const [jsonText, setJsonText] = useState('');
  const [url, setUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and process JSON-LD
  const validateAndProcess = useCallback((text: string) => {
    if (!text.trim()) {
      setValidation(null);
      return;
    }

    try {
      const data = JSON.parse(text);
      
      // Basic JSON-LD validation
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (typeof data !== 'object' || data === null) {
        errors.push('JSON-LD must be an object or array');
      }

      // Check for @context
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (typeof item === 'object' && item !== null && !('@context' in item)) {
            warnings.push(`Item ${index + 1} missing @context`);
          }
        });
      } else if (typeof data === 'object' && !('@context' in data)) {
        warnings.push('Missing @context property');
      }

      // Estimate node/link counts
      let nodeCount = 0;
      let linkCount = 0;
      
      const countNodes = (obj: unknown): void => {
        if (typeof obj === 'object' && obj !== null) {
          const objRecord = obj as Record<string, unknown>;
          if ('@id' in objRecord || '@type' in objRecord) {
            nodeCount++;
          }
          Object.values(objRecord).forEach(value => {
            if (Array.isArray(value)) {
              value.forEach(countNodes);
              linkCount += value.length;
            } else if (typeof value === 'object') {
              countNodes(value);
              linkCount++;
            }
          });
        }
      };

      if (Array.isArray(data)) {
        data.forEach(countNodes);
      } else {
        countNodes(data);
      }

      setValidation({
        isValid: errors.length === 0,
        errors,
        warnings,
        nodeCount,
        linkCount
      });

      if (errors.length === 0) {
        onDataLoad(data);
      }
    } catch (error) {
      setValidation({
        isValid: false,
        errors: ['Invalid JSON syntax: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings: []
      });
    }
  }, [onDataLoad]);

  // Handle URL loading
  const handleUrlLoad = useCallback(async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      setJsonText(text);
      setActiveTab('paste');
      validateAndProcess(text);
      
      toast.success('Data loaded successfully', {
        description: 'JSON-LD data loaded from URL'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      toast.error('Failed to load URL', {
        description: errorMessage
      });
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, validateAndProcess, onError]);

  useEffect(() => {
    handleUrlLoad();
  }, [handleUrlLoad]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('json') && !file.name.endsWith('.jsonld')) {
      toast.error('Invalid file type', {
        description: 'Please upload a JSON or JSON-LD file.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      setJsonText(text);
      setActiveTab('paste');
      validateAndProcess(text);
    } catch (error) {
      toast.error('Failed to read file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateAndProcess]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle text change
  const handleTextChange = useCallback((value: string) => {
    setJsonText(value);
    const timeoutId = setTimeout(() => validateAndProcess(value), 500);
    return () => clearTimeout(timeoutId);
  }, [validateAndProcess]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [jsonText]);

  // Load example data
  const loadExample = useCallback(() => {
    const exampleData = {
      "@context": "https://schema.org/",
      "@type": "Person",
      "@id": "https://example.com/person/1",
      "name": "Jane Doe",
      "jobTitle": "Software Engineer",
      "email": "jane.doe@example.com",
      "worksFor": {
        "@type": "Organization",
        "@id": "https://example.com/org/1",
        "name": "Tech Corp",
        "url": "https://techcorp.example.com"
      },
      "knows": [
        {
          "@type": "Person",
          "@id": "https://example.com/person/2",
          "name": "John Smith"
        },
        {
          "@type": "Person", 
          "@id": "https://example.com/person/3",
          "name": "Alice Johnson"
        }
      ]
    };
    
    const text = JSON.stringify(exampleData, null, 2);
    setJsonText(text);
    setActiveTab('paste');
    validateAndProcess(text);
    toast.success('Example data loaded!');
  }, [validateAndProcess]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-900/40 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
              <Upload className="h-5 w-5 text-white" />
            </div>
            Load JSON-LD Data
          </CardTitle>
          <p className="text-muted-foreground">
            Import your JSON-LD data from multiple sources to begin exploration.
          </p>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-background/50 backdrop-blur-sm">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Paste
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>

            {/* Paste Tab */}
            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="json-input">JSON-LD Content</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadExample}
                      className="text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Load Example
                    </Button>
                    {jsonText && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-xs"
                        >
                          {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                          {showPreview ? 'Hide' : 'Preview'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <Textarea
                  id="json-input"
                  placeholder="Paste your JSON-LD content here..."
                  value={jsonText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.jsonld"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                
                <motion.div
                  animate={dragActive ? { scale: 1.05 } : { scale: 1 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium">
                      {dragActive ? 'Drop your file here' : 'Drag & drop your JSON-LD file'}
                    </p>
                    <p className="text-muted-foreground">
                      or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-violet-600 hover:text-violet-700 font-medium underline"
                      >
                        browse files
                      </button>
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">.json</Badge>
                    <Badge variant="secondary">.jsonld</Badge>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">JSON-LD URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/data.jsonld"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                  />
                  <Button 
                    onClick={handleUrlLoad} 
                    disabled={isLoading || !url.trim()}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Default data indicator */}
                {url === DEFAULT_URL && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Default career data will be loaded automatically from GitHub Gist
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation Results */}
          <AnimatePresence>
            {validation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validation.errors.map((error, i) => (
                          <div key={i}>{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validation.warnings.map((warning, i) => (
                          <div key={i}>{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.isValid && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <div className="flex items-center gap-4">
                        <span>Valid JSON-LD data loaded successfully!</span>
                        {validation.nodeCount !== undefined && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {validation.nodeCount} nodes
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {validation.linkCount} links
                            </Badge>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* JSON Preview */}
          <AnimatePresence>
            {showPreview && jsonText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label>Preview</Label>
                <div className="max-h-60 overflow-auto border rounded-md bg-gray-50 dark:bg-gray-900 p-3">
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    {jsonText}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
