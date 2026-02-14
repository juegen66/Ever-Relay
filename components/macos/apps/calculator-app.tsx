"use client"

import { useState } from "react"

export function CalculatorApp() {
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [resetNext, setResetNext] = useState(false)

  const handleNumber = (num: string) => {
    if (resetNext) {
      setDisplay(num)
      setResetNext(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
    }
  }

  const handleOperator = (operator: string) => {
    const current = parseFloat(display)
    if (prev !== null && op) {
      const result = calculate(prev, current, op)
      setDisplay(String(result))
      setPrev(result)
    } else {
      setPrev(current)
    }
    setOp(operator)
    setResetNext(true)
  }

  const calculate = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+": return a + b
      case "-": return a - b
      case "*": return a * b
      case "/": return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const handleEquals = () => {
    if (prev !== null && op) {
      const current = parseFloat(display)
      const result = calculate(prev, current, op)
      setDisplay(String(result))
      setPrev(null)
      setOp(null)
      setResetNext(true)
    }
  }

  const handleClear = () => {
    setDisplay("0")
    setPrev(null)
    setOp(null)
    setResetNext(false)
  }

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const handleToggleSign = () => {
    setDisplay(String(parseFloat(display) * -1))
  }

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  const btnBase = "flex items-center justify-center rounded-full text-xl font-light transition-all active:brightness-75 select-none"

  const numBtn = `${btnBase} bg-[#505050] text-white hover:bg-[#6a6a6a]`
  const opBtn = `${btnBase} bg-[#ff9f0a] text-white hover:bg-[#ffb340] text-2xl`
  const topBtn = `${btnBase} bg-[#a5a5a5] text-[#1c1c1c] hover:bg-[#c5c5c5]`

  return (
    <div className="flex h-full flex-col" style={{ background: "#2a2a2a" }}>
      {/* Display */}
      <div className="flex items-end justify-end px-5 pb-2 pt-4">
        <span
          className="text-white font-light truncate"
          style={{
            fontSize: display.length > 9 ? "28px" : display.length > 6 ? "36px" : "48px",
            lineHeight: 1.1,
          }}
        >
          {display.length > 12 ? parseFloat(display).toExponential(6) : display}
        </span>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2 p-3 flex-1">
        <button className={topBtn} onClick={handleClear} style={{ height: "48px" }}>
          {prev !== null || op ? "C" : "AC"}
        </button>
        <button className={topBtn} onClick={handleToggleSign} style={{ height: "48px" }}>
          +/-
        </button>
        <button className={topBtn} onClick={handlePercent} style={{ height: "48px" }}>
          %
        </button>
        <button className={opBtn} onClick={() => handleOperator("/")} style={{ height: "48px" }}>
          {"\u00F7"}
        </button>

        <button className={numBtn} onClick={() => handleNumber("7")} style={{ height: "48px" }}>7</button>
        <button className={numBtn} onClick={() => handleNumber("8")} style={{ height: "48px" }}>8</button>
        <button className={numBtn} onClick={() => handleNumber("9")} style={{ height: "48px" }}>9</button>
        <button className={opBtn} onClick={() => handleOperator("*")} style={{ height: "48px" }}>
          {"\u00D7"}
        </button>

        <button className={numBtn} onClick={() => handleNumber("4")} style={{ height: "48px" }}>4</button>
        <button className={numBtn} onClick={() => handleNumber("5")} style={{ height: "48px" }}>5</button>
        <button className={numBtn} onClick={() => handleNumber("6")} style={{ height: "48px" }}>6</button>
        <button className={opBtn} onClick={() => handleOperator("-")} style={{ height: "48px" }}>-</button>

        <button className={numBtn} onClick={() => handleNumber("1")} style={{ height: "48px" }}>1</button>
        <button className={numBtn} onClick={() => handleNumber("2")} style={{ height: "48px" }}>2</button>
        <button className={numBtn} onClick={() => handleNumber("3")} style={{ height: "48px" }}>3</button>
        <button className={opBtn} onClick={() => handleOperator("+")} style={{ height: "48px" }}>+</button>

        <button
          className={`${numBtn} col-span-2`}
          onClick={() => handleNumber("0")}
          style={{ height: "48px", borderRadius: "24px", justifyContent: "flex-start", paddingLeft: "20px" }}
        >
          0
        </button>
        <button className={numBtn} onClick={handleDecimal} style={{ height: "48px" }}>.</button>
        <button className={opBtn} onClick={handleEquals} style={{ height: "48px" }}>=</button>
      </div>
    </div>
  )
}
