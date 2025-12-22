import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { FullTextSearchConfig as FullTextSearchConfigType } from '@/types/namespace';

interface FullTextSearchConfigProps {
  config: FullTextSearchConfigType;
  onChange: (config: FullTextSearchConfigType) => void;
}

const SUPPORTED_LANGUAGES = [
  'arabic', 'danish', 'dutch', 'english', 'finnish', 'french', 'german', 
  'greek', 'hungarian', 'italian', 'norwegian', 'portuguese', 'romanian', 
  'russian', 'spanish', 'swedish', 'tamil', 'turkish'
];

const TOKENIZERS = [
  { value: 'word_v2', label: 'Word v2 (Unicode 16.0, with emoji)' },
  { value: 'word_v1', label: 'Word v1 (Default, Unicode 10.0)' },
  { value: 'word_v0', label: 'Word v0 (Legacy, no emoji)' },
  { value: 'pre_tokenized_array', label: 'Pre-tokenized Array' },
];

export const FullTextSearchConfig: React.FC<FullTextSearchConfigProps> = ({
  config,
  onChange,
}) => {
  const updateConfig = (updates: Partial<FullTextSearchConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h4 className="font-medium">BM25 Configuration</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fts-language">Language</Label>
          <Select
            value={config.language || 'english'}
            onValueChange={(value) => updateConfig({ language: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fts-tokenizer">Tokenizer</Label>
          <Select
            value={config.tokenizer || 'word_v1'}
            onValueChange={(value) => updateConfig({ tokenizer: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOKENIZERS.map(tokenizer => (
                <SelectItem key={tokenizer.value} value={tokenizer.value}>
                  {tokenizer.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fts-stemming"
            checked={config.stemming ?? false}
            onCheckedChange={(checked) => updateConfig({ stemming: checked as boolean })}
          />
          <Label htmlFor="fts-stemming">Enable stemming</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="fts-stopwords"
            checked={config.remove_stopwords ?? true}
            onCheckedChange={(checked) => updateConfig({ remove_stopwords: checked as boolean })}
          />
          <Label htmlFor="fts-stopwords">Remove stopwords</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="fts-case-sensitive"
            checked={config.case_sensitive ?? false}
            onCheckedChange={(checked) => updateConfig({ case_sensitive: checked as boolean })}
          />
          <Label htmlFor="fts-case-sensitive">Case sensitive</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fts-k1">k1 Parameter</Label>
          <Input
            id="fts-k1"
            type="number"
            step="0.1"
            min="0.1"
            value={config.k1 ?? 1.2}
            onChange={(e) => updateConfig({ k1: parseFloat(e.target.value) })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Term frequency saturation (default: 1.2)
          </p>
        </div>

        <div>
          <Label htmlFor="fts-b">b Parameter</Label>
          <Input
            id="fts-b"
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={config.b ?? 0.75}
            onChange={(e) => updateConfig({ b: parseFloat(e.target.value) })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Document length normalization (default: 0.75)
          </p>
        </div>
      </div>
    </div>
  );
};