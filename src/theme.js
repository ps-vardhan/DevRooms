import { extendTheme, defineStyleConfig } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: "#e5e3ff",
      100: "#b8b2ff",
      200: "#8a81ff",
      300: "#5d50ff",
      400: "#2f1fff",
      500: "#1606e6",
      600: "#1105b4",
      700: "#0b0382",
      800: "#060250",
      900: "#02011f",
    },
    obsidian: {
      50: "#f2f2f3",
      100: "#d9d9db",
      200: "#bfbfbc",
      300: "#a6a6a1",
      400: "#8c8c82",
      500: "#737363",
      600: "#5c5c4f",
      700: "#45453b",
      800: "#2d2d27",
      900: "#161613",
    },
    accent: {
      indigo: "#6366f1",
      violet: "#8b5cf6",
      emerald: "#10b981",
      rose: "#f43f5e",
    }
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "obsidian.900",
        color: "whiteAlpha.900",
      },
      "::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "::-webkit-scrollbar-track": {
        bg: "transparent",
      },
      "::-webkit-scrollbar-thumb": {
        bg: "whiteAlpha.200",
        borderRadius: "full",
        _hover: {
          bg: "whiteAlpha.300",
        },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "xl",
        transition: "all 0.2s cubic-bezier(.08,.52,.52,1)",
      },
      variants: {
        glass: {
          bg: "whiteAlpha.100",
          backdropFilter: "blur(10px)",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          _hover: {
            bg: "whiteAlpha.200",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          },
          _active: {
            bg: "whiteAlpha.300",
            transform: "translateY(0)",
          },
        },
        premium: {
          bgGradient: "linear(to-br, accent.indigo, accent.violet)",
          color: "white",
          _hover: {
            bgGradient: "linear(to-br, accent.violet, accent.indigo)",
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
          },
        }
      }
    },
    Box: {
      variants: {
        glass: {
          bg: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid",
          borderColor: "whiteAlpha.100",
          borderRadius: "2xl",
        }
      }
    },
    Heading: {
      baseStyle: {
        letterSpacing: "tight",
      }
    }
  }
});

export default theme;