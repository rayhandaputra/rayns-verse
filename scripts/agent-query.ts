import { argv } from "process";

async function main() {
  const url = "https://data.kinau.web.id/apicore-latest/agent-query";
  const queryStr = argv.slice(2).join(" ");

  if (!queryStr) {
    console.warn(
      'Please provide a SQL query as an argument. Example: npx tsx scripts/agent-query.ts "SHOW TABLES"',
    );
    return;
  }

  console.log(`Sending query to ${url}:`);
  console.log(`Query parameter: ${JSON.stringify(queryStr)}`);

  // Detect token from environment or fallback to standard keys
  const apiKey =
    process.env.AGENT_QUERY_API_KEY ||
    process.env.API_KEY ||
    "REPLACE_WITH_STRONG_KEY";
  const agentKey =
    process.env.AGENT_KEY ||
    process.env.X_AGENT_KEY ||
    "REPLACE_WITH_AGENT_KEY";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-agent-key": agentKey,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sql: queryStr,
      }),
    });

    console.log(`Response Status: ${response.status}`);
    const text = await response.text();
    console.log("Response text:");
    try {
      const parsed = JSON.parse(text);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(text);
    }
  } catch (error: any) {
    console.error("Error making agent-query:", error.message || error);
  }
}

main();
