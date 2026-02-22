import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", false && "hidden", true && "visible");
    expect(result).toBe("base visible");
  });

  it("should handle undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });

  it("should merge conflicting Tailwind classes", () => {
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });

  it("should merge conflicting Tailwind color classes", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("should handle empty arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle array of classes", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toBe("foo bar");
  });

  it("should handle object syntax", () => {
    const result = cn({ "font-bold": true, "text-sm": false, "text-lg": true });
    expect(result).toBe("font-bold text-lg");
  });

  it("should merge complex Tailwind conflicts", () => {
    const result = cn("p-4 bg-red-500", "p-2 bg-blue-500");
    expect(result).toBe("p-2 bg-blue-500");
  });
});
