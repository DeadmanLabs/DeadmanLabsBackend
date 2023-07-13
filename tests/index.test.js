const request = require('supertest');
const app = require("../index.js");

beforeEach(async () => {
    console.log('Testing...');
});

afterEach(async () => {
    console.log('Done!');
});

describe("GET /", () => {
    it("should return dictionary", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
    });
});

describe("POST /", () => {
    it("should return the provided message", async () => {
        const res = await request(app).post("/").send({
            message: "Test message!"
        });
        expect(res.statusCode).toBe(200);
    });
});

