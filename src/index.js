import * as core from '@actions/core';
import fetch from 'node-fetch';

/**
 * メイン関数
 */
async function run() {
  try {
    const apiKey = core.getInput('openai_admin_key', { required: true });
    const dateFrom = core.getInput('date_from');
    const dateTo = core.getInput('date_to');
    
    let url = 'https://api.openai.com/v1/organization/costs';
    
    const params = new URLSearchParams();
    if (dateFrom) params.append('start_date', dateFrom);
    if (dateTo) params.append('end_date', dateTo);
    
    if ([...params].length > 0) {
      url = `${url}?${params.toString()}`;
    }
    
    core.debug(`Requesting: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    const formattedData = {
      amount: {
        value: data.total_usage || 0,
        currency: 'usd'
      },
      project_id: data.project_id || ''
    };
    
    core.setOutput('costs', JSON.stringify(formattedData));
    
    core.info('Successfully retrieved OpenAI organization costs');
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
