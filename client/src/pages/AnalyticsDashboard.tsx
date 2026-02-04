import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react";

export function AnalyticsDashboard() {
  const { data: pipelineData, isLoading: pipelineLoading } = trpc.analytics.getDealPipeline.useQuery();
  const { data: conversionData, isLoading: conversionLoading } = trpc.analytics.getConversionRates.useQuery();
  const { data: cycleTimeData, isLoading: cycleTimeLoading } = trpc.analytics.getDealCycleTime.useQuery();
  const { data: campaignTrends, isLoading: trendsLoading } = trpc.analytics.getCampaignTrends.useQuery({});
  const { data: overallMetrics, isLoading: metricsLoading } = trpc.analytics.getOverallMetrics.useQuery();

  if (pipelineLoading || conversionLoading || cycleTimeLoading || trendsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your CRM performance and insights
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Deals</p>
              <p className="text-2xl font-bold">{overallMetrics?.totalDeals || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <p className="text-2xl font-bold">
                ${(overallMetrics?.totalDealValue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sequences</p>
              <p className="text-2xl font-bold">
                {overallMetrics?.activeSequenceEnrollments || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Cycle Time</p>
              <p className="text-2xl font-bold">
                {cycleTimeData?.averageDays || 0} days
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deal Pipeline by Stage */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Deal Pipeline by Stage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stageName" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="dealCount" fill="#8884d8" name="Deal Count" />
            <Bar yAxisId="right" dataKey="totalValue" fill="#82ca9d" name="Total Value ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Stage Conversion Rates */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Stage Conversion Rates</h2>
        <div className="space-y-4">
          {conversionData?.map((conversion: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    {conversion.from} → {conversion.to}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {conversion.conversionRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(conversion.conversionRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {conversion.currentCount} → {conversion.nextCount}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Campaign Performance Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Campaign Performance Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={campaignTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="openRate" stroke="#8884d8" name="Open Rate (%)" />
            <Line type="monotone" dataKey="clickRate" stroke="#82ca9d" name="Click Rate (%)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
