const request = require("supertest");
const app = require("../../server");

describe("/api/generate-image endpoint", () => {
  it("should return 200 and valid response for a valid topicId", async () => {
    const response = await request(app)
      .post("/api/generate-image")
      .send({ topicId: 0 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("topic");
    expect(response.body).toHaveProperty("elements");
    expect(Array.isArray(response.body.elements)).toBe(true);
    expect(response.body).toHaveProperty("image");
    expect(typeof response.body.image).toBe("string");
    expect(response.body.image.length).toBeGreaterThan(100);
  });

  it("should return 400 for missing topicId", async () => {
    const response = await request(app).post("/api/generate-image").send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 for invalid topicId (negative)", async () => {
    const response = await request(app)
      .post("/api/generate-image")
      .send({ topicId: -1 });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 for invalid topicId (too high)", async () => {
    const response = await request(app)
      .post("/api/generate-image")
      .send({ topicId: 99 });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 for invalid topicId (not an integer)", async () => {
    const response = await request(app)
      .post("/api/generate-image")
      .send({ topicId: "foo" });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
