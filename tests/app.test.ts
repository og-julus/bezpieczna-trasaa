import { expect, test } from "bun:test";
import { searchAccidents } from "../src/index";

test("zwraca rekordy z bazy", async () => {
  const results = await searchAccidents("");
  expect(results.length).toBeGreaterThan(0);
});

test("zwraca pustą tablicę dla nieistniejącej frazy", async () => {
  const results = await searchAccidents("NieistniejacaFrazaXYZ999");
  expect(results.length).toBe(0);
});