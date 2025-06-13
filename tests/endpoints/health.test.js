const request = require("supertest");
const app = require("../../server");

describe("/health endpoint", () => {
  it("should return status ok", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  // Example negative test (simulate server error if you add error handling logic)
  // it('should handle server errors', async () => {
  //   // Simulate error scenario here if possible
  // });
});
