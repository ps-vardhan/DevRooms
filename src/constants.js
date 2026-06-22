export const Languages = {
  javascript: {
    label: "JavaScript",
    filename: "solution.js",
    code: `function greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("Guest");\n`
  },
  typescript: {
    label: "TypeScript",
    filename: "solution.ts",
    code: `function greet(name: string): void {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("Guest");\n`
  },
  python: {
    label: "Python",
    filename: "solution.py",
    code: `def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("User")\n`
  },
  java: {
    label: "Java",
    filename: "Solution.java",
    code: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}\n`
  },
  cpp: {
    label: "C++",
    filename: "solution.cpp",
    code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}\n`
  }
};

// Legacy compatibility exports
export const Language_Versions = {
  JavaScript: "ES2025",
  TypeScript: "5.4",
  Python: "3.14.2",
  Java: "25 LTS",
  "C++": "GCC 14"
};

export const Code_Snippets = {
  JavaScript: Languages.javascript.code,
  TypeScript: Languages.typescript.code,
  Python: Languages.python.code,
  Java: Languages.java.code,
  "C++": Languages.cpp.code
};

export const File_Names = {
  JavaScript: Languages.javascript.filename,
  TypeScript: Languages.typescript.filename,
  Python: Languages.python.filename,
  Java: Languages.java.filename,
  "C++": Languages.cpp.filename
};

