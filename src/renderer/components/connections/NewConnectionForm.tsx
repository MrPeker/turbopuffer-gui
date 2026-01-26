import React, { useState } from "react";
import { useConnections } from "../../contexts/ConnectionContext";
import { TURBOPUFFER_REGIONS } from "../../../types/connection";
import type { ConnectionFormData } from "../../../types/connection";
import { turbopufferService } from "../../services/turbopufferService";
import { RegionMultiSelect } from "./RegionMultiSelect";

export function NewConnectionForm() {
  const { saveConnection, testConnection } = useConnections();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    regionIds: TURBOPUFFER_REGIONS.map(r => r.id), // Default: all regions selected
    apiKey: "",
    isReadOnly: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.apiKey || formData.regionIds.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await saveConnection(formData);
    } catch (error) {
      console.error("Failed to save connection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.apiKey || formData.regionIds.length === 0) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test with the first selected region (API key is valid across all regions)
      const region = TURBOPUFFER_REGIONS.find(r => r.id === formData.regionIds[0]);
      if (!region) {
        throw new Error('No valid region selected');
      }

      const result = await turbopufferService.testConnection(
        formData.apiKey,
        region
      );
      setTestResult({
        ...result,
        message: result.success
          ? `Connection successful (tested via ${region.location})`
          : result.message,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      <div>
        <div>
          <h1>Turbopuffer Client</h1>
          <p>Third-party open source client for Turbopuffer vector database • Early beta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Connection Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <p>A friendly name for your connection</p>
          </div>

          <div>
            <label>Regions</label>
            <p className="text-xs text-tp-text-muted mb-2">
              Select which regions to include in this connection
            </p>
            <RegionMultiSelect
              selectedRegionIds={formData.regionIds}
              onChange={(regionIds) => setFormData({ ...formData, regionIds })}
            />
          </div>

          <div>
            <label>API Key</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              required
            />
            <p>
              Enter your API key starting with "tpuf_". Get it from the{" "}
              <button
                type="button"
                onClick={() => window.electronAPI.openExternal("https://turbopuffer.com/dashboard")}
                className="text-primary hover:underline"
              >
                Turbopuffer dashboard
              </button>
            </p>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={formData.isReadOnly}
                onChange={(e) =>
                  setFormData({ ...formData, isReadOnly: e.target.checked })
                }
              />
              {" "}Read-Only Mode
            </label>
            <p>
              Prevent write operations (upsert, delete, schema changes)
            </p>
          </div>

          {testResult && (
            <div>
              {testResult.success ? "✓" : "✗"} {testResult.message}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={!formData.apiKey || formData.regionIds.length === 0 || isTesting}
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.apiKey || formData.regionIds.length === 0 || isSaving}
            >
              {isSaving ? "Creating..." : "Create Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
