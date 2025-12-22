import React, { useState } from "react";
import { useConnections } from "../../contexts/ConnectionContext";
import { TURBOPUFFER_REGIONS } from "../../../types/connection";
import type { ConnectionFormData } from "../../../types/connection";
import { turbopufferService } from "../../services/turbopufferService";

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
    regionId: TURBOPUFFER_REGIONS[0].id,
    apiKey: "",
    isReadOnly: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.apiKey) {
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
    if (!formData.apiKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const region = TURBOPUFFER_REGIONS.find(r => r.id === formData.regionId);
      if (!region) {
        throw new Error('Invalid region selected');
      }
      
      const result = await turbopufferService.testConnection(
        formData.apiKey,
        region
      );
      setTestResult(result);
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
            <label>Region</label>
            <select
              value={formData.regionId}
              onChange={(e) =>
                setFormData({ ...formData, regionId: e.target.value })
              }
              required
            >
              {TURBOPUFFER_REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name} ({region.id}) • {region.location}
                </option>
              ))}
            </select>
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
              disabled={!formData.apiKey || isTesting}
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.apiKey || isSaving}
            >
              {isSaving ? "Creating..." : "Create Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
