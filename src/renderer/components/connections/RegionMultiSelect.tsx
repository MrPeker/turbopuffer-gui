import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TURBOPUFFER_REGIONS, type TurbopufferRegion } from '../../../types/connection';
import { cn } from '@/lib/utils';

interface RegionMultiSelectProps {
  selectedRegionIds: string[];
  onChange: (regionIds: string[]) => void;
  disabled?: boolean;
}

export function RegionMultiSelect({
  selectedRegionIds,
  onChange,
  disabled = false,
}: RegionMultiSelectProps) {
  const { gcpRegions, awsRegions } = useMemo(() => {
    return {
      gcpRegions: TURBOPUFFER_REGIONS.filter(r => r.provider === 'gcp'),
      awsRegions: TURBOPUFFER_REGIONS.filter(r => r.provider === 'aws'),
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedRegionIds), [selectedRegionIds]);

  const gcpSelectedCount = useMemo(
    () => gcpRegions.filter(r => selectedSet.has(r.id)).length,
    [gcpRegions, selectedSet]
  );

  const awsSelectedCount = useMemo(
    () => awsRegions.filter(r => selectedSet.has(r.id)).length,
    [awsRegions, selectedSet]
  );

  const isAllGcpSelected = gcpSelectedCount === gcpRegions.length;
  const isAllAwsSelected = awsSelectedCount === awsRegions.length;
  const isSomeGcpSelected = gcpSelectedCount > 0 && !isAllGcpSelected;
  const isSomeAwsSelected = awsSelectedCount > 0 && !isAllAwsSelected;

  const handleToggleRegion = (regionId: string) => {
    if (disabled) return;

    const newSet = new Set(selectedRegionIds);
    if (newSet.has(regionId)) {
      newSet.delete(regionId);
    } else {
      newSet.add(regionId);
    }
    onChange(Array.from(newSet));
  };

  const handleToggleProvider = (provider: 'gcp' | 'aws') => {
    if (disabled) return;

    const regions = provider === 'gcp' ? gcpRegions : awsRegions;
    const regionIds = regions.map(r => r.id);
    const allSelected = provider === 'gcp' ? isAllGcpSelected : isAllAwsSelected;

    const newSet = new Set(selectedRegionIds);

    if (allSelected) {
      regionIds.forEach(id => newSet.delete(id));
    } else {
      regionIds.forEach(id => newSet.add(id));
    }

    onChange(Array.from(newSet));
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(TURBOPUFFER_REGIONS.map(r => r.id));
  };

  const handleSelectNone = () => {
    if (disabled) return;
    onChange([]);
  };

  const renderRegionItem = (region: TurbopufferRegion) => {
    const isSelected = selectedSet.has(region.id);

    return (
      <label
        key={region.id}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-tp-surface-alt/50 transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleRegion(region.id)}
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
        <span className="text-xs text-tp-text flex-1">
          {region.location}
        </span>
        <span className="text-[10px] text-tp-text-muted font-mono">
          {region.id}
        </span>
      </label>
    );
  };

  const renderProviderSection = (
    provider: 'gcp' | 'aws',
    regions: TurbopufferRegion[],
    selectedCount: number,
    isAllSelected: boolean,
    isSomeSelected: boolean
  ) => {
    const providerName = provider === 'gcp' ? 'GCP' : 'AWS';
    const providerFullName = provider === 'gcp' ? 'Google Cloud' : 'Amazon Web Services';

    return (
      <div className="border border-tp-border-subtle bg-tp-bg">
        <div className="flex items-center justify-between px-3 py-2 bg-tp-surface border-b border-tp-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-tp-text-muted">
              {providerFullName}
            </span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              {selectedCount}/{regions.length}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => handleToggleProvider(provider)}
            disabled={disabled}
            className={cn(
              "text-[10px] font-medium text-tp-accent hover:text-tp-accent/80 transition-colors",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="divide-y divide-tp-border-subtle/50">
          {regions.map(renderRegionItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5 px-2">
            {selectedRegionIds.length} of {TURBOPUFFER_REGIONS.length} regions
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || selectedRegionIds.length === TURBOPUFFER_REGIONS.length}
            className={cn(
              "text-[10px] font-medium text-tp-accent hover:text-tp-accent/80 transition-colors",
              (disabled || selectedRegionIds.length === TURBOPUFFER_REGIONS.length) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            All
          </button>
          <span className="text-tp-text-muted">·</span>
          <button
            type="button"
            onClick={handleSelectNone}
            disabled={disabled || selectedRegionIds.length === 0}
            className={cn(
              "text-[10px] font-medium text-tp-text-muted hover:text-tp-text transition-colors",
              (disabled || selectedRegionIds.length === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderProviderSection('gcp', gcpRegions, gcpSelectedCount, isAllGcpSelected, isSomeGcpSelected)}
        {renderProviderSection('aws', awsRegions, awsSelectedCount, isAllAwsSelected, isSomeAwsSelected)}
      </div>

      {selectedRegionIds.length === 0 && (
        <p className="text-[10px] text-tp-danger">
          At least one region must be selected
        </p>
      )}
    </div>
  );
}
