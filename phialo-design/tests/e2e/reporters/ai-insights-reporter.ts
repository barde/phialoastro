import type { Reporter, TestCase, TestResult, Suite } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom reporter that generates AI insights from test results
 */
class AIInsightsReporter implements Reporter {
  private insights: any[] = [];
  private startTime: Date = new Date();
  
  onBegin(config: any, suite: Suite) {
    console.log('🤖 AI Insights Reporter: Starting analysis...');
  }
  
  onTestEnd(test: TestCase, result: TestResult) {
    // Collect insights from AI-powered tests
    if (test.title.includes('@ai')) {
      const insight = {
        test: test.title,
        status: result.status,
        duration: result.duration,
        retries: result.retry,
        
        // Extract AI-specific metrics
        aiOperations: this.extractAIOperations(result),
        selfHealingAttempts: this.extractSelfHealingAttempts(result),
        naturalLanguageCommands: this.extractNLCommands(result),
        
        // Performance metrics
        aiResponseTime: this.calculateAIResponseTime(result),
        
        // Failure analysis
        failureReason: result.status === 'failed' ? this.analyzeFailure(result) : null,
      };
      
      this.insights.push(insight);
    }
  }
  
  onEnd(result: any) {
    const report = {
      summary: {
        totalTests: this.insights.length,
        passed: this.insights.filter(i => i.status === 'passed').length,
        failed: this.insights.filter(i => i.status === 'failed').length,
        flaky: this.insights.filter(i => i.retries > 0).length,
        totalDuration: new Date().getTime() - this.startTime.getTime(),
      },
      
      aiMetrics: {
        totalAIOperations: this.insights.reduce((sum, i) => sum + i.aiOperations, 0),
        averageAIResponseTime: this.calculateAverageResponseTime(),
        selfHealingSuccessRate: this.calculateSelfHealingSuccessRate(),
        mostUsedCommands: this.getMostUsedCommands(),
      },
      
      recommendations: this.generateRecommendations(),
      
      insights: this.insights,
    };
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'ai-insights-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary to console
    console.log('\n📊 AI Testing Insights Summary:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`🔄 Flaky: ${report.summary.flaky}`);
    console.log(`🤖 AI Operations: ${report.aiMetrics.totalAIOperations}`);
    console.log(`⚡ Avg AI Response: ${report.aiMetrics.averageAIResponseTime}ms`);
    console.log(`🔧 Self-healing Success: ${report.aiMetrics.selfHealingSuccessRate}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec: string) => {
        console.log(`   - ${rec}`);
      });
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
  
  private extractAIOperations(result: TestResult): number {
    // Count AI operations from stdout
    const aiPatterns = [
      /ai\(/g,
      /AITestHelper/g,
      /natural language/gi,
    ];
    
    let count = 0;
    result.stdout.forEach(output => {
      const text = typeof output === 'string' ? output : output.toString();
      aiPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) count += matches.length;
      });
    });
    
    return count;
  }
  
  private extractSelfHealingAttempts(result: TestResult): number {
    // Count self-healing attempts from logs
    let attempts = 0;
    result.stdout.forEach(output => {
      const text = typeof output === 'string' ? output : output.toString();
      if (text.includes('self-healing') || text.includes('fallback strategy')) {
        attempts++;
      }
    });
    return attempts;
  }
  
  private extractNLCommands(result: TestResult): string[] {
    // Extract natural language commands used
    const commands: string[] = [];
    const nlPattern = /ai\(['"]([^'"]+)['"]/g;
    
    result.stdout.forEach(output => {
      const text = typeof output === 'string' ? output : output.toString();
      let match;
      while ((match = nlPattern.exec(text)) !== null) {
        commands.push(match[1]);
      }
    });
    
    return commands;
  }
  
  private calculateAIResponseTime(result: TestResult): number {
    // Estimate AI response time from logs
    const aiTimings: number[] = [];
    const timingPattern = /AI operation took (\d+)ms/g;
    
    result.stdout.forEach(output => {
      const text = typeof output === 'string' ? output : output.toString();
      let match;
      while ((match = timingPattern.exec(text)) !== null) {
        aiTimings.push(parseInt(match[1]));
      }
    });
    
    return aiTimings.length > 0 
      ? Math.round(aiTimings.reduce((a, b) => a + b, 0) / aiTimings.length)
      : 0;
  }
  
  private analyzeFailure(result: TestResult): string {
    // Analyze failure reasons for AI tests
    if (result.error?.message?.includes('timeout')) {
      return 'AI operation timeout - consider increasing timeout or optimizing prompts';
    }
    if (result.error?.message?.includes('element not found')) {
      return 'Element not found - AI failed to locate element, consider adding more context';
    }
    if (result.error?.message?.includes('API')) {
      return 'AI API error - check API keys and service availability';
    }
    return result.error?.message || 'Unknown failure';
  }
  
  private calculateAverageResponseTime(): number {
    const times = this.insights
      .map(i => i.aiResponseTime)
      .filter(t => t > 0);
    
    return times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
  }
  
  private calculateSelfHealingSuccessRate(): number {
    const withHealing = this.insights.filter(i => i.selfHealingAttempts > 0);
    if (withHealing.length === 0) return 100;
    
    const successful = withHealing.filter(i => i.status === 'passed').length;
    return Math.round((successful / withHealing.length) * 100);
  }
  
  private getMostUsedCommands(): string[] {
    const commandCounts = new Map<string, number>();
    
    this.insights.forEach(insight => {
      insight.naturalLanguageCommands?.forEach((cmd: string) => {
        commandCounts.set(cmd, (commandCounts.get(cmd) || 0) + 1);
      });
    });
    
    return Array.from(commandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd]) => cmd);
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for high failure rate
    const failureRate = this.insights.filter(i => i.status === 'failed').length / this.insights.length;
    if (failureRate > 0.2) {
      recommendations.push('High failure rate detected. Consider refining AI prompts or adding more specific selectors.');
    }
    
    // Check for slow AI operations
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 5000) {
      recommendations.push('AI operations are slow. Consider caching results or optimizing prompts.');
    }
    
    // Check for excessive retries
    const retryRate = this.insights.filter(i => i.retries > 0).length / this.insights.length;
    if (retryRate > 0.3) {
      recommendations.push('High retry rate indicates flaky tests. Add more specific wait conditions.');
    }
    
    // Check self-healing usage
    const healingRate = this.insights.filter(i => i.selfHealingAttempts > 0).length / this.insights.length;
    if (healingRate > 0.5) {
      recommendations.push('Heavy reliance on self-healing. Consider updating selectors to be more stable.');
    }
    
    return recommendations;
  }
}

export default AIInsightsReporter;