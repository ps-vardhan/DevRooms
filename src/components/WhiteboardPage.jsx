import {
  Box,
  Flex,
  Heading,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Button,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { useParams, useNavigate } from "react-router-dom";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import "../App.css";
import AudioFooter from "./AudioFooter";
import Canvas from "./Canvas";
import ToolBar from "./ToolBar";
import { FaCode } from "react-icons/fa";

const CANVAS_WIDTH = 2500;
const CANVAS_HEIGHT = 1800;

function WhiteboardPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [brushType, setBrushType] = useState("default");
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isEraser, setIsEraser] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  const [doc, setDoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const [roomPassword, setRoomPassword] = useState("");
  const [userName, setUserName] = useState("Guest");

  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const userNameRef = useRef("Guest");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let currentName = "Guest";
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        currentName = parsedUser.username || "Guest";
      } catch (e) {
        console.error("WhiteboardPage:Failed to parse user", e);
      }
    }

    userNameRef.current = currentName;
    setUserName(currentName);

    const pass = localStorage.getItem("current_room_pass");
    if (pass) setRoomPassword(pass);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      "ws://localhost:5000/yjs",
      roomId,
      ydoc
    );

    wsProvider.awareness.setLocalStateField("user", {
      name: userNameRef.current,
      color:
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0"),
    });

    setDoc(ydoc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const c = scrollRef.current;
    setTimeout(() => {
      c.scroll(
        (c.scrollWidth - c.clientWidth) / 2,
        (c.scrollHeight - c.clientHeight) / 2
      );
    }, 100);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom((z) => Math.min(3, z + 0.1));
      }
      if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, z - 0.1));
      }
      if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSaveState = (dataUrl) => {
    const next = history.slice(0, historyStep + 1);
    next.push(dataUrl);
    setHistory(next);
    setHistoryStep(next.length - 1);
  };

  const toggleEraser = () => {
    setIsEraser((p) => !p);
    if (!isEraser) setBrushType("default");
  };

  const handleUndo = () => {
    if (historyStep > 0) setHistoryStep((prev) => prev - 1);
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) setHistoryStep((prev) => prev + 1);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    handleSaveState();

    if (doc) {
      const arr = doc.getArray("paint-ops");
      arr.delete(0, arr.length);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.save();
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(tmp.width / 2, tmp.height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-tmp.width / 2, -tmp.height / 2);
    const d = Math.sqrt(tmp.width ** 2 + tmp.height ** 2);
    for (let x = -d; x < tmp.width + d; x += 150)
      for (let y = -d; y < tmp.height + d; y += 100) ctx.fillText("PAINT", x, y);
    ctx.restore();
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.download = "drawing.png";
    a.href = tmp.toDataURL();
    a.click();
  };

  return (
    <Box height="100vh" width="100vw" display="flex" flexDirection="column" overflow="hidden" bg="#e2e8f0">
      {/* Header */}
      <Box
        px={6}
        py={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="rgba(15, 10, 25, 0.7)"
        backdropFilter="blur(15px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        zIndex={20}>
        <Flex alignItems="center" gap={4}>
          <Heading
            size="md"
            fontWeight="bold"
            letterSpacing="tight"
            bgGradient="linear(to-r, white, whiteAlpha.600)"
            bgClip="text">
            Whiteboard
          </Heading>
        </Flex>

        <Flex alignItems="center" gap={3}>
          <Button
            leftIcon={<FaCode />}
            size="sm"
            variant="glass"
            onClick={() => navigate(`/editor/${roomId}`)}>
            Code Workspace
          </Button>

          <Popover placement="bottom-end">
            <PopoverTrigger>
              <IconButton
                icon={<IoMdInformationCircleOutline size={22} />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                color="whiteAlpha.700"
                _hover={{ color: "white" }}
              />
            </PopoverTrigger>
            <PopoverContent bg="gray.900" borderColor="whiteAlpha.200" boxShadow="dark-lg" color="white" width="auto" minW="220px">
              <PopoverArrow bg="gray.900" />
              <PopoverCloseButton />
              <PopoverHeader fontWeight="bold" borderBottomColor="whiteAlpha.100" fontSize="sm">Session Details</PopoverHeader>
              <PopoverBody p={4}>
                <Text mb={2} fontSize="xs" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="widest">Room ID</Text>
                <Text mb={4} fontWeight="medium" fontSize="sm">{roomId}</Text>
                <Text mb={2} fontSize="xs" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="widest">Pass Key</Text>
                <Text fontWeight="medium" fontSize="sm">{roomPassword || "***************"}</Text>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>
      </Box>

      {/* Main Canvas Area */}
      <Box flex="1" position="relative" overflow="hidden">
        <Box
          ref={scrollRef}
          width="100%"
          height="100%"
          overflow="auto"
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          padding="0"
          bg="#cbd5e0">
          {doc ? (
            <Canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              zoom={zoom}
              brushSize={brushSize}
              brushType={brushType}
              onSaveState={handleSaveState}
              historyImage={history[historyStep]}
              color={isEraser ? "#ffffff" : color}
              isEraser={isEraser}
              doc={doc}
            />
          ) : (
            <Box color="gray.600">Loading Canvas...</Box>
          )}
        </Box>

        <ToolBar
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushType={brushType}
          setBrushType={setBrushType}
          handleUndo={handleUndo}
          canUndo={historyStep > 0}
          handleRedo={handleRedo}
          canRedo={historyStep < history.length - 1}
          handleClear={handleClear}
          handleSave={handleSave}
          isEraser={isEraser}
          toggleEraser={toggleEraser}
          zoom={zoom}
          setZoom={setZoom}
        />
      </Box>

      <AudioFooter />
    </Box>
  );
}

export default WhiteboardPage;
