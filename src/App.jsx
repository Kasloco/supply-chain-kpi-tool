import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, MessageSquare, Loader2, TrendingUp, Package, Clock, Database } from 'lucide-react';

function App() {
  const [inboundData, setInboundData] = useState(null);
  const [outboundData, setOutboundData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [kpiSummary, setKpiSummary] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Handle CSV file uploads
  const handleFileUpload = (event, dataType) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          if (dataType === 'inbound') {
            setInboundData(result.data);
          } else if (dataType === 'outbound') {
            setOutboundData(result.data);
          } else if (dataType === 'inventory') {
            setInventoryData(result.data);
          }
        },
        header: true,
        skipEmptyLines: true,
      });
    }
  };

  // Generate comprehensive KPI summary when all data is loaded
  useEffect(() => {
    if (inboundData && outboundData && inventoryData) {
      let summary = `=== COMPREHENSIVE SUPPLY CHAIN KPI SUMMARY ===\n\n`;

      // === INBOUND METRICS ===
      summary += `📦 INBOUND LOGISTICS (Vendor Performance)\n`;
      summary += `${'='.repeat(50)}\n`;
      const totalInbound = inboundData.length;
      const onTimeDeliveries = inboundData.filter(row => row.Late === 'No').length;
      const onTimeRate = ((onTimeDeliveries / totalInbound) * 100).toFixed(2);
      
      summary += `Total Inbound Orders: ${totalInbound}\n`;
      summary += `On-Time Delivery Rate: ${onTimeRate}%\n`;
      summary += `Late Deliveries: ${totalInbound - onTimeDeliveries} (${(100 - onTimeRate).toFixed(2)}%)\n\n`;

      // Vendor Performance
      const vendorStats = {};
      inboundData.forEach(row => {
        const vendor = row['Vendor Name'];
        if (vendor) {
          if (!vendorStats[vendor]) {
            vendorStats[vendor] = { total: 0, onTime: 0, units: 0 };
          }
          vendorStats[vendor].total++;
          if (row.Late === 'No') vendorStats[vendor].onTime++;
          vendorStats[vendor].units += parseInt(row.Units || 0);
        }
      });

      summary += `Top 3 Vendors by On-Time Performance:\n`;
      Object.entries(vendorStats)
        .sort((a, b) => (b[1].onTime / b[1].total) - (a[1].onTime / a[1].total))
        .slice(0, 3)
        .forEach(([vendor, stats], idx) => {
          const rate = ((stats.onTime / stats.total) * 100).toFixed(1);
          summary += `  ${idx + 1}. ${vendor}: ${rate}% (${stats.onTime}/${stats.total} orders, ${stats.units.toLocaleString()} units)\n`;
        });

      // Transit Mode Performance
      summary += `\nTransit Mode Performance:\n`;
      const transitStats = {};
      inboundData.forEach(row => {
        const mode = row.Transit_Mode;
        if (mode) {
          if (!transitStats[mode]) {
            transitStats[mode] = { total: 0, onTime: 0 };
          }
          transitStats[mode].total++;
          if (row.Late === 'No') transitStats[mode].onTime++;
        }
      });
      Object.entries(transitStats).forEach(([mode, stats]) => {
        const rate = ((stats.onTime / stats.total) * 100).toFixed(1);
        summary += `  - ${mode}: ${rate}% on-time (${stats.onTime}/${stats.total})\n`;
      });

      // Delay Reasons
      summary += `\nTop 3 Delay Reasons:\n`;
      const reasonCounts = {};
      inboundData.forEach(row => {
        const reason = row.Reason_Code;
        if (reason) reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
      Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([reason, count], idx) => {
          const pct = ((count / totalInbound) * 100).toFixed(1);
          summary += `  ${idx + 1}. ${reason.replace(/_/g, ' ')}: ${count} orders (${pct}%)\n`;
        });

      // === OUTBOUND METRICS ===
      summary += `\n\n🚚 OUTBOUND FULFILLMENT (Customer Orders)\n`;
      summary += `${'='.repeat(50)}\n`;
      const totalOutbound = outboundData.length;
      const totalUnitsOrdered = outboundData.reduce((sum, row) => sum + parseInt(row.Units_Ordered || 0), 0);
      const totalUnitsInvoiced = outboundData.reduce((sum, row) => sum + parseInt(row.Units_Invoiced || 0), 0);
      const fulfillmentRate = ((totalUnitsInvoiced / totalUnitsOrdered) * 100).toFixed(2);

      summary += `Total Orders: ${totalOutbound}\n`;
      summary += `Units Ordered: ${totalUnitsOrdered.toLocaleString()}\n`;
      summary += `Units Invoiced: ${totalUnitsInvoiced.toLocaleString()}\n`;
      summary += `Fulfillment Rate: ${fulfillmentRate}%\n\n`;

      // Channel Performance
      const channelStats = {};
      outboundData.forEach(row => {
        const channel = row.Channel;
        if (channel) {
          if (!channelStats[channel]) {
            channelStats[channel] = { orders: 0, units: 0, revenue: 0 };
          }
          channelStats[channel].orders++;
          channelStats[channel].units += parseInt(row.Units_Invoiced || 0);
          channelStats[channel].revenue += (parseFloat(row.Avg_Price || 0) * parseInt(row.Units_Invoiced || 0));
        }
      });

      summary += `Channel Breakdown:\n`;
      Object.entries(channelStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([channel, stats]) => {
          const avgMargin = outboundData
            .filter(row => row.Channel === channel)
            .reduce((sum, row) => sum + parseFloat(row.Margin_Pct || 0), 0) / 
            outboundData.filter(row => row.Channel === channel).length;
          summary += `  - ${channel}: ${stats.orders} orders, ${stats.units.toLocaleString()} units, $${(stats.revenue / 1000000).toFixed(2)}M revenue, ${(avgMargin * 100).toFixed(1)}% avg margin\n`;
        });

      // === INVENTORY METRICS ===
      summary += `\n\n📊 INVENTORY & PRODUCT CATALOG\n`;
      summary += `${'='.repeat(50)}\n`;
      summary += `Total SKUs: ${inventoryData.length}\n\n`;

      // Product Group Distribution
      const productGroups = {};
      inventoryData.forEach(row => {
        const group = row['Product Group'];
        if (group) productGroups[group] = (productGroups[group] || 0) + 1;
      });

      summary += `Product Group Distribution:\n`;
      Object.entries(productGroups)
        .sort((a, b) => b[1] - a[1])
        .forEach(([group, count]) => {
          const pct = ((count / inventoryData.length) * 100).toFixed(1);
          summary += `  - ${group}: ${count} SKUs (${pct}%)\n`;
        });

      // Division Split
      const divisions = {};
      inventoryData.forEach(row => {
        const div = row.Division;
        if (div) divisions[div] = (divisions[div] || 0) + 1;
      });
      summary += `\nDivision Split:\n`;
      Object.entries(divisions).forEach(([div, count]) => {
        const pct = ((count / inventoryData.length) * 100).toFixed(1);
        summary += `  - ${div}: ${count} SKUs (${pct}%)\n`;
      });

      // === CROSS-DATASET INSIGHTS ===
      summary += `\n\n🔗 INTEGRATED INSIGHTS\n`;
      summary += `${'='.repeat(50)}\n`;
      
      // Calculate total revenue
      const totalRevenue = outboundData.reduce((sum, row) => 
        sum + (parseFloat(row.Avg_Price || 0) * parseInt(row.Units_Invoiced || 0)), 0
      );
      summary += `Total Revenue: $${(totalRevenue / 1000000).toFixed(2)}M\n`;
      
      // Calculate weighted average margin
      const weightedMargin = outboundData.reduce((sum, row) => 
        sum + (parseFloat(row.Margin_Pct || 0) * parseInt(row.Units_Invoiced || 0)), 0
      ) / totalUnitsInvoiced;
      summary += `Weighted Avg Margin: ${(weightedMargin * 100).toFixed(2)}%\n`;
      
      // Inbound units vs Outbound units
      const totalInboundUnits = inboundData.reduce((sum, row) => sum + parseInt(row.Units || 0), 0);
      summary += `Inbound Units Received: ${totalInboundUnits.toLocaleString()}\n`;
      summary += `Outbound Units Shipped: ${totalUnitsInvoiced.toLocaleString()}\n`;
      const turnoverRatio = (totalUnitsInvoiced / totalInboundUnits * 100).toFixed(1);
      summary += `Inventory Turnover Indicator: ${turnoverRatio}%\n`;

      setKpiSummary(summary);
    }
  }, [inboundData, outboundData, inventoryData]);

  // Query Claude API
  const handleQuery = async () => {
    if (!query.trim() || !apiKey.trim()) {
      alert('Please enter both an API key and a query');
      return;
    }

    if (!kpiSummary) {
      alert('Please upload all three CSV files first');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const result = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.anthropic.com/v1/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: `You are analyzing a complete supply chain dataset for Tory Burch with Inbound (vendor deliveries), Outbound (customer orders), and Inventory (product catalog) data. 

Based on this comprehensive supply chain data summary, please answer the question with specific insights and actionable recommendations:

${kpiSummary}

Question: ${query}

Provide a detailed answer with specific numbers and insights from the data. Format your response with clear headers using ## for main sections, and use bullet points where appropriate.`,
            },
          ],
        }),
      });

      const data = await result.json();
      const actualData = data.contents ? JSON.parse(data.contents) : data;
      
      if (actualData.error) {
        setResponse(`API Error: ${actualData.error.message || JSON.stringify(actualData.error)}`);
      } else if (actualData.content && actualData.content[0] && actualData.content[0].text) {
        setResponse(actualData.content[0].text);
      } else {
        setResponse(`Unexpected response format: ${JSON.stringify(actualData)}`);
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const allDataLoaded = inboundData && outboundData && inventoryData;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #fff5f0 50%, #f0f8f0 100%)' }}>
      {/* Header */}
      <div className="bg-white shadow-md border-b-4" style={{ borderBottomColor: '#F47321' }}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#005030' }}>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#005030' }}>Supply Chain KPI Analytics</h1>
              <p className="text-gray-600 text-sm mt-1">End-to-end supply chain intelligence powered by Claude AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* API Key Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6" style={{ border: '2px solid #F47321' }}>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#005030' }}>
            🔑 Anthropic API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all"
            style={{ borderColor: '#F47321' }}
            onFocus={(e) => e.target.style.borderColor = '#005030'}
            onBlur={(e) => e.target.style.borderColor = '#F47321'}
          />
        </div>

        {/* Multi-CSV Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Inbound Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #005030' }}>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5" style={{ color: '#F47321' }} />
              <h3 className="font-semibold" style={{ color: '#005030' }}>Inbound Data</h3>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all"
              style={{ 
                borderColor: inboundData ? '#005030' : '#F47321',
                background: inboundData ? 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%)' : 'linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%)'
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 mb-2" style={{ color: inboundData ? '#005030' : '#F47321' }} />
                <p className="text-sm font-medium text-center px-2" style={{ color: '#005030' }}>
                  {inboundData ? `✓ ${inboundData.length} rows loaded` : 'Upload Inbound CSV'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Vendor deliveries</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'inbound')}
                className="hidden"
              />
            </label>
          </div>

          {/* Outbound Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #005030' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" style={{ color: '#F47321' }} />
              <h3 className="font-semibold" style={{ color: '#005030' }}>Outbound Data</h3>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all"
              style={{ 
                borderColor: outboundData ? '#005030' : '#F47321',
                background: outboundData ? 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%)' : 'linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%)'
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 mb-2" style={{ color: outboundData ? '#005030' : '#F47321' }} />
                <p className="text-sm font-medium text-center px-2" style={{ color: '#005030' }}>
                  {outboundData ? `✓ ${outboundData.length} rows loaded` : 'Upload Outbound CSV'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Customer orders</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'outbound')}
                className="hidden"
              />
            </label>
          </div>

          {/* Inventory Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #005030' }}>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5" style={{ color: '#F47321' }} />
              <h3 className="font-semibold" style={{ color: '#005030' }}>Inventory Data</h3>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all"
              style={{ 
                borderColor: inventoryData ? '#005030' : '#F47321',
                background: inventoryData ? 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%)' : 'linear-gradient(135deg, #fff5f0 0%, #ffe8d9 100%)'
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 mb-2" style={{ color: inventoryData ? '#005030' : '#F47321' }} />
                <p className="text-sm font-medium text-center px-2" style={{ color: '#005030' }}>
                  {inventoryData ? `✓ ${inventoryData.length} rows loaded` : 'Upload Inventory CSV'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Product catalog</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'inventory')}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* KPI Summary Display */}
        {kpiSummary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6" style={{ border: '2px solid #F47321' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: '#005030' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#005030' }}>Comprehensive KPI Dashboard</h2>
            </div>
            <div className="rounded-lg p-6 border-2 max-h-96 overflow-y-auto" 
              style={{ 
                background: 'linear-gradient(135deg, #f0f8f0 0%, #fff5f0 100%)',
                borderColor: '#005030'
              }}
            >
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed" style={{ color: '#005030' }}>
                {kpiSummary}
              </pre>
            </div>
          </div>
        )}

        {/* Query Interface */}
        {allDataLoaded && (
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #005030' }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" style={{ color: '#F47321' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#005030' }}>Ask a Question</h2>
            </div>
            
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'How do vendor delays impact our retail revenue?' or 'Which product groups have the best margins?'"
              className="w-full px-4 py-3 border-2 rounded-lg mb-4 transition-all resize-none focus:outline-none"
              rows="3"
              style={{ borderColor: '#F47321' }}
              onFocus={(e) => e.target.style.borderColor = '#005030'}
              onBlur={(e) => e.target.style.borderColor = '#F47321'}
            />
            
            <button
              onClick={handleQuery}
              disabled={loading}
              className="w-full text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #F47321 0%, #d96419 100%)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = 'linear-gradient(135deg, #d96419 0%, #c25515 100%)')}
              onMouseLeave={(e) => !loading && (e.target.style.background = 'linear-gradient(135deg, #F47321 0%, #d96419 100%)')}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Get Answer
                </>
              )}
            </button>

            {response && (
              <div className="mt-6 rounded-lg p-6 border-2" 
                style={{ 
                  background: 'linear-gradient(135deg, #f0f8f0 0%, #fff5f0 100%)',
                  borderColor: '#F47321'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#005030' }}>
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold" style={{ color: '#005030' }}>Claude's Response</h3>
                </div>
                <div className="leading-relaxed bg-white rounded-lg p-6 border-2" style={{ color: '#005030', borderColor: '#005030' }}>
                  {response.split('\n').map((paragraph, idx) => {
                    // Check if it's a header (starts with ##)
                    if (paragraph.trim().startsWith('##')) {
                      return (
                        <h3 key={idx} className="text-lg font-bold mt-4 mb-2" style={{ color: '#F47321' }}>
                          {paragraph.replace(/^##\s*/, '')}
                        </h3>
                      );
                    }
                    // Check if it's a bold section header
                    if (paragraph.match(/^\*\*.*:\*\*/)) {
                      return (
                        <h4 key={idx} className="font-semibold mt-3 mb-1" style={{ color: '#005030' }}>
                          {paragraph.replace(/\*\*/g, '')}
                        </h4>
                      );
                    }
                    // Check if it's a bullet point
                    if (paragraph.trim().match(/^[-•*]\s/)) {
                      return (
                        <div key={idx} className="ml-4 mb-2 flex gap-2">
                          <span style={{ color: '#F47321' }}>•</span>
                          <span>{paragraph.replace(/^[-•*]\s/, '')}</span>
                        </div>
                      );
                    }
                    // Check if it's a numbered list
                    if (paragraph.trim().match(/^\d+\.\s/)) {
                      return (
                        <div key={idx} className="ml-4 mb-2">
                          <span className="font-semibold" style={{ color: '#F47321' }}>
                            {paragraph.match(/^\d+\./)[0]}
                          </span>
                          <span> {paragraph.replace(/^\d+\.\s/, '')}</span>
                        </div>
                      );
                    }
                    // Regular paragraph
                    if (paragraph.trim()) {
                      return (
                        <p key={idx} className="mb-3">
                          {paragraph}
                        </p>
                      );
                    }
                    // Empty line for spacing
                    return <div key={idx} className="h-2"></div>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!allDataLoaded && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center" style={{ border: '2px solid #F47321' }}>
            <Database className="w-16 h-16 mx-auto mb-4" style={{ color: '#F47321' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#005030' }}>
              Upload All Three Datasets to Begin
            </h3>
            <p className="text-gray-600">
              Please upload Inbound, Outbound, and Inventory CSV files to generate comprehensive supply chain insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;