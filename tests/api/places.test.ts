import { describe, expect, it } from "vitest";
import { call, newUser } from "./helpers";

// India PIN code to state (owner's motion and forms spec, 27 Nov 2026). LOCAL stack, synthetic accounts.
// The lookup runs on the server only (the india-pincode data is about 3.7 MB) and stores nothing.

describe("PIN code lookup", () => {
  it("a known PIN code gives the state as listed (so it can be saved as is) and the city", async () => {
    const u = await newUser();
    const a = await call(u, "POST", "/v1/places/pincode", { pin: "380001" });
    expect(a.status).toBe(200);
    expect(a.body).toEqual({ state: "Gujarat", city: "Ahmadabad" });
    // A union territory whose name changed in 2020 comes back under its current listed name.
    const b = await call(u, "POST", "/v1/places/pincode", { pin: "396210" });
    expect(b.status).toBe(200);
    expect(b.body.state).toBe("Dadra and Nagar Haveli and Daman and Diu");
    const c = await call(u, "POST", "/v1/places/pincode", { pin: "744101" });
    expect(c.status).toBe(200);
    expect(c.body.state).toBe("Andaman and Nicobar Islands");
  });

  it("an unknown PIN code is 404 with a plain next step; a malformed one is 422", async () => {
    const u = await newUser();
    const missing = await call(u, "POST", "/v1/places/pincode", { pin: "999999" });
    expect(missing.status).toBe(404);
    expect(JSON.stringify(missing.body)).toContain("Choose your state from the list instead.");
    for (const bad of ["012345", "12345", "1234567", "abcdef"]) {
      expect((await call(u, "POST", "/v1/places/pincode", { pin: bad })).status).toBe(422);
    }
  });

  it("the PIN code travels in the body, never in the address: the old address form is gone", async () => {
    const u = await newUser();
    expect([404, 405]).toContain((await call(u, "GET", "/v1/places/pincode/380001")).status);
    expect([404, 405]).toContain((await call(u, "GET", "/v1/places/pincode")).status);
  });

  it("is for signed-in people only", async () => {
    expect((await call(null, "POST", "/v1/places/pincode", { pin: "380001" })).status).toBe(401);
  });
});
