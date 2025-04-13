import * as core from '@actions/core';
import fetch from 'node-fetch';

/**
 * 日付から前日と翌日を計算する関数
 * @param {string} dateStr - YYYY-MM-DD形式の日付文字列
 * @returns {Object} 開始日と終了日
 */
function calculateDateRange(dateStr) {
  const date = new Date(dateStr);
  
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}. Expected format is YYYY-MM-DD`);
  }
  
  date.setHours(0, 0, 0, 0);
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    from: formatDate(date),
    to: formatDate(date)
  };
}

/**
 * YYYY-MM-DD形式の日付文字列をUnixタイムスタンプ（秒、UTC 00:00:00）に変換する関数
 * @param {string} dateStr - YYYY-MM-DD形式の日付文字列
 * @returns {number} Unixタイムスタンプ（秒）
 */
function dateToUnixTimestampStart(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`); // UTCとして解釈
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format for start time: ${dateStr}. Expected format is YYYY-MM-DD`);
  }
  return Math.floor(date.getTime() / 1000);
}

/**
 * YYYY-MM-DD形式の日付文字列を翌日のUnixタイムスタンプ（秒、UTC 00:00:00）に変換する関数（排他的終了時刻用）
 * @param {string} dateStr - YYYY-MM-DD形式の日付文字列
 * @returns {number} Unixタイムスタンプ（秒）
 */
function dateToUnixTimestampEnd(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`); // UTCとして解釈
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format for end time: ${dateStr}. Expected format is YYYY-MM-DD`);
  }
  date.setUTCDate(date.getUTCDate() + 1);
  return Math.floor(date.getTime() / 1000);
}


/**
 * メイン関数
 */
async function run() {
  try {
    const apiKey = core.getInput('openai_admin_key', { required: true });
    core.setSecret(apiKey); // Mask the API key in logs
    let dateFrom = core.getInput('date_from');
    let dateTo = core.getInput('date_to');
    const singleDate = core.getInput('date');
    
    if (singleDate && (!dateFrom || !dateTo)) {
      try {
        const dateRange = calculateDateRange(singleDate);
        if (!dateFrom) dateFrom = dateRange.from;
        if (!dateTo) dateTo = dateRange.to;
        core.info(`Using date range calculated from single date: ${dateFrom} to ${dateTo}`);
      } catch (error) {
        core.warning(`Failed to calculate date range from single date: ${error.message}`);
      }
    }
    
    let url = 'https://api.openai.com/v1/organization/costs';
    
    const params = new URLSearchParams();
    params.append('group_by', 'project_id');
    params.append('bucket_width', '1d');

    if (dateFrom) {
      try {
        const startTime = dateToUnixTimestampStart(dateFrom);
        params.append('start_time', startTime.toString());
      } catch (error) {
        core.warning(`Failed to parse start date: ${error.message}`);
      }
    }
    if (dateTo) {
      try {
        const endTime = dateToUnixTimestampEnd(dateTo);
        params.append('end_time', endTime.toString());
      } catch (error) {
        core.warning(`Failed to parse end date: ${error.message}`);
      }
    }

    const queryString = params.toString();

    
    if (queryString) {
      url = `${url}?${queryString}`;
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
