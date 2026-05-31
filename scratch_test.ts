import { OverviewAPI } from "./app/nexus/modules/overview.server";

async function test() {
  try {
    console.log("Running OverviewAPI.summary...");
    // Mock session
    const session = {
      user: { role: "admin" },
      token: "test-token"
    };
    const result = await OverviewAPI.summary({ session, req: { query: {} } });
    console.log("Result:", result);
  } catch (error) {
    console.error("Caught error:", error);
  }
}

test();
