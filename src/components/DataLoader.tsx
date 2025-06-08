import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Link, Check, AlertCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JSONLDProcessor } from '@/utils/dataProcessing';
import { JSONLDData } from '@/types';

interface DataLoaderProps {
  onDataLoaded: (data: JSONLDData | JSONLDData[]) => void;
  isLoading: boolean;
}

const DEFAULT_GIST_URL = 'https://gist.githubusercontent.com/wyattowalsh/f60976c79f7b904fea81cb9b97dd8c3c/raw/career.jsonld';

export function DataLoader({ onDataLoaded, isLoading }: DataLoaderProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const { toast } = useToast();

  const loadData = async (url: string) => {
    try {
      setUrlError('');
      const data = await JSONLDProcessor.loadFromUrl(url);
      
      if (!JSONLDProcessor.validateJSONLD(data)) {
        throw new Error('Invalid JSON-LD format');
      }

      onDataLoaded(data);
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${Array.isArray(data) ? data.length : 1} entities`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setUrlError(errorMessage);
      toast({
        title: "Error loading data",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLoadDefault = () => {
    loadData(DEFAULT_GIST_URL);
  };

  const handleLoadCustom = () => {
    if (!customUrl.trim()) {
      setUrlError('Please enter a valid URL');
      return;
    }

    try {
      new URL(customUrl);
      loadData(customUrl);
    } catch {
      setUrlError('Please enter a valid URL');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!JSONLDProcessor.validateJSONLD(data)) {
          throw new Error('Invalid JSON-LD format');
        }

        onDataLoaded(data);
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${Array.isArray(data) ? data.length : 1} entities`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "Please ensure the file contains valid JSON-LD data",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Database className="w-16 h-16 mx-auto text-primary" />
        </motion.div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
            JSON-LD Data Explorer
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Explore, analyze, and visualize your linked data with advanced analytics
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Default Dataset
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              Load the default career dataset to explore advanced graph analytics and visualizations.
            </p>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">Career Data</Badge>
              <Badge variant="outline" className="text-xs">Professional Network</Badge>
            </div>
            <Button 
              onClick={handleLoadDefault}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Load Default Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-600/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Custom URL
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              Load JSON-LD data from any accessible URL endpoint.
            </p>
            <div className="space-y-3">
              <Input
                placeholder="https://example.com/data.jsonld"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className={urlError ? 'border-destructive' : ''}
              />
              {urlError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-destructive"
                >
                  <AlertCircle className="w-4 h-4" />
                  {urlError}
                </motion.div>
              )}
              <Button 
                onClick={handleLoadCustom}
                disabled={isLoading || !customUrl.trim()}
                className="w-full"
                variant="outline"
                size="lg"
              >
                <Link className="w-4 h-4 mr-2" />
                Load from URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-600/10" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a JSON-LD file from your local machine for analysis.
            </p>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">JSON-LD files only</p>
              </div>
              <input
                type="file"
                accept=".json,.jsonld"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}