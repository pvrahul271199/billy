import { describe, expect, it } from "vitest";
import { amountInWords, numberToIndianWords } from "./amount-in-words";

describe("numberToIndianWords", () => {
  it.each([
    [0, "Zero"],
    [7, "Seven"],
    [15, "Fifteen"],
    [20, "Twenty"],
    [48, "Forty-Eight"],
    [100, "One Hundred"],
    [101, "One Hundred One"],
    [999, "Nine Hundred Ninety-Nine"],
    [1000, "One Thousand"],
    [48500, "Forty-Eight Thousand Five Hundred"],
    [100000, "One Lakh"],
    [123456, "One Lakh Twenty-Three Thousand Four Hundred Fifty-Six"],
    [9999999, "Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine"],
    [10000000, "One Crore"],
    [125000000, "Twelve Crore Fifty Lakh"],
    [1000000000, "One Hundred Crore"],
  ])("%i → %s", (n, words) => {
    expect(numberToIndianWords(n)).toBe(words);
  });
});

describe("amountInWords", () => {
  it("matches the spec example", () => {
    expect(amountInWords(4850000)).toBe("Rupees Forty-Eight Thousand Five Hundred Only");
  });
  it("includes paise", () => {
    expect(amountInWords(4850050)).toBe("Rupees Forty-Eight Thousand Five Hundred and Fifty Paise Only");
    expect(amountInWords(105)).toBe("Rupees One and Five Paise Only");
  });
  it("handles zero", () => {
    expect(amountInWords(0)).toBe("Rupees Zero Only");
  });
});
