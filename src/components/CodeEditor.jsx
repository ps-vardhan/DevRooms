import { Box, Button, useToast } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { forwardRef, useImperativeHandle } from "react";
// import { useParams } from "react-router-dom";
import { MonacoBinding } from "y-monaco";
// import { WebsocketProvider } from "y-websocket";
// import * as Y from "yjs";
import { Code_Snippets } from "../constants";
import LanguageSelector from "./LanguageSelector";
import Output from "./Output";

const CodeEditor = forwardRef(({ doc, provider, language }, ref) => {
  // const { roomId } = useParams();
  const [value, setValue] = useState("");
  // const [language, setLanguage] = useState("Select Language");
  const editorRef = useRef();

  const [outputWidth, setOutputWidth] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const toast = useToast();

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();

    if (!doc || !provider) return;

    const type = doc.getText("monaco");

    const binding = new MonacoBinding(
      type,
      editor.getModel(),
      new Set([editor]),
      provider.awareness,
    );

    if (language === "Select Lang") {
      editor.setValue("// Select a Language");
    }
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(Code_Snippets[language]);

    if (editorRef.current) {
      editorRef.current.setValue(Code_Snippets[language]);
    }
  };

  const startResize = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const stopResize = () => {
    setIsDragging(false);
  };

  const resize = (e) => {
    if (isDragging) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 150 && newWidth < window.innerWidth * 0.7) {
        setOutputWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      if (language === "Select Lang") {
        editorRef.current.setValue("// Select a Language");
      } else if (Code_Snippets[language]) {
        editorRef.current.setValue(Code_Snippets[language]);
      }
    }
  }, [language]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResize);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isDragging]);

  const runCode = (e) => {
    e?.preventDefault();

    if (!editorRef.current) return;

    setIsOutputOpen(true);
    if (outputWidth < 200) setOutputWidth(300);

    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    setLoading(true);

    setTimeout(() => {
      setLogs([">Output"]);
      toast({ title: "code", status: "success" });
      setLoading(false);
    }, 1000);
  };

  useImperativeHandle(ref, () => ({
    runCode: runCode
  }));

  return (
    <Box height="100%" display="flex" flexDirection="row" overflow="hidden">
      <Box flex="1" overflow="hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          defaultValue="// Select a Language"
          theme="vs-dark"
          onMount={onMount}
          onChange={(val) => setValue(val)}
        />
      </Box>

      <Box
        width="6px"
        bg="whiteAlpha.50"
        cursor="ew-resize"
        onMouseDown={startResize}
        _hover={{ bg: "accent.indigo", boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
        transition="all 0.2s"
        zIndex={5}
      />
      <Box width={`${outputWidth}px`} bg="#0f0a19">
        <Output
          isOpen={isOutputOpen}
          logs={logs}
        />
      </Box>
    </Box >
  );
});
export default CodeEditor;
