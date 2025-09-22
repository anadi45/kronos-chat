import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { Integration, Provider } from '@kronos/core';

interface IntegrationIconProps {
  integrationId: string;
  className?: string;
}

const IntegrationIcon: React.FC<IntegrationIconProps> = ({
  integrationId,
  className = 'w-6 h-6',
}) => {
  const getImageSrc = (id: string) => {
    return `/images/integrations/${id.toLowerCase()}.png`;
  };

  return (
    <div className="integration-icon-wrapper">
      <img
        src={getImageSrc(integrationId)}
        alt={`${integrationId} icon`}
        className={className}
        style={{ objectFit: 'contain' }}
        onError={(e) => {
          // Fallback to a default icon if image fails to load
          e.currentTarget.src = '/images/integrations/default.svg';
        }}
      />
    </div>
  );
};

interface IntegrationSelectorProps {
  selectedToolkits: Provider[];
  onToolkitsChange: (toolkits: Provider[]) => void;
}

const IntegrationSelector: React.FC<IntegrationSelectorProps> = ({
  selectedToolkits,
  onToolkitsChange,
}) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadIntegrations();
    
    // Listen for integration changes from other components
    const handleIntegrationChange = () => {
      console.log('Integration change detected, refreshing IntegrationSelector');
      loadIntegrations();
    };
    
    window.addEventListener('integrationChanged', handleIntegrationChange);
    
    return () => {
      window.removeEventListener('integrationChanged', handleIntegrationChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !(event.target as Element).closest('.integration-selector')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const integrations = await apiService.getAvailableIntegrations();
      // Only show connected integrations, but always include Web Research
      const connectedIntegrations = integrations.filter(
        (integration) => integration.isConnected
      );

      // Add Web Research if it's not already in the list
      const hasWebResearch = connectedIntegrations.some(
        (integration) => integration.id === 'WEBRESEARCH'
      );
      if (!hasWebResearch) {
        const webResearchIntegration = integrations.find(
          (integration) => integration.id === 'WEBRESEARCH'
        );
        if (webResearchIntegration) {
          connectedIntegrations.push(webResearchIntegration);
        }
      }

      setIntegrations(connectedIntegrations);

      // Auto-select all available integrations by default
      if (connectedIntegrations.length > 0) {
        const allProviderIds = connectedIntegrations.map(
          (integration) => integration.id as Provider
        );
        onToolkitsChange(allProviderIds);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = (provider: Provider) => {
    if (selectedToolkits.includes(provider)) {
      onToolkitsChange(selectedToolkits.filter((t) => t !== provider));
    } else {
      onToolkitsChange([...selectedToolkits, provider]);
    }
  };

  if (loading) {
    return (
      <div className="integration-selector">
        <div className="integration-selector-trigger">
          <div className="integration-selector-loading">
            <div className="integration-selector-spinner"></div>
            <span>Loading integrations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="integration-selector">
        <div className="integration-selector-trigger">
          <div className="integration-selector-empty">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>No connected integrations</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-selector">
      <button
        className="integration-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="integration-selector-content">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span className="integration-selector-text">
            {selectedToolkits.length === 0
              ? 'Select integrations'
              : `${selectedToolkits.length} integration${
                  selectedToolkits.length !== 1 ? 's' : ''
                } selected`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="integration-selector-dropdown">
          <div className="integration-selector-header">
            <h4>Select Integrations</h4>
            <p>
              Choose which integrations Kronos can use for this conversation
            </p>
          </div>

          <div className="integration-selector-list">
            {integrations.map((integration) => {
              const isSelected = selectedToolkits.includes(integration.id);
              return (
                <button
                  key={integration.id}
                  className={`integration-selector-item ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => handleToggleIntegration(integration.id)}
                  type="button"
                >
                  <div className="integration-selector-item-content">
                    <div className="integration-selector-item-icon">
                      <IntegrationIcon
                        integrationId={integration.id}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="integration-selector-item-info">
                      <div className="integration-selector-item-name">
                        {integration.name}
                      </div>
                      <div className="integration-selector-item-description">
                        {integration.description}
                      </div>
                    </div>
                    <div className="integration-selector-item-checkbox">
                      <div
                        className={`integration-checkbox ${
                          isSelected ? 'checked' : ''
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationSelector;
