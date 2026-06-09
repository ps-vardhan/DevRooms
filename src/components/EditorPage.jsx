import {
  Box,
  Button,
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
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { useParams, useNavigate } from "react-router-dom";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import "../App.css";
import AudioFooter from "./AudioFooter";
import CodeEditor from "./CodeEditor";
import LanguageSelector from "./LanguageSelector";
import { FaChalkboard } from "react-icons/fa";

function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [language, setLanguage] = useState("Select Lang");

  const [doc, setDoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const [roomPassword, setRoomPassword] = useState("");
  const [userName, setUserName] = useState("Guest");

  const codeEditorRef = useRef();
  const userNameRef = useRef("Guest");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let currentName = "Guest";
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        currentName = parsedUser.username || "Guest";
      } catch (e) {
        console.error("EditorPage:Failed to parse user", e);
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

  const onSelect = (lang) => setLanguage(lang);

  return (
    <Box height="100vh" width="100vw" display="flex" flexDirection="column" overflow="hidden">
      <Flex direction="column" height="100%" bg="#0f0a19" color="gray.500">
        {/* Header */}
        <Box
          w="100%"
          px={6}
          py={3}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg="rgba(15, 10, 25, 0.7)"
          backdropFilter="blur(15px)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          zIndex={10}>
          <Box display="flex" alignItems="center" width="250px">
            <Heading
              size="md"
              fontWeight="bold"
              letterSpacing="tight"
              bgGradient="linear(to-r, white, whiteAlpha.600)"
              bgClip="text">
              Code Workspace
            </Heading>
          </Box>

          <Box flex="1" display="flex" justifyContent="center">
            <LanguageSelector language={language} onSelect={onSelect} />
          </Box>

          <Box
            display="flex"
            alignItems="center"
            width="350px"
            justifyContent="flex-end"
            gap={3}>

            <Button
              leftIcon={<FaChalkboard />}
              size="sm"
              variant="glass"
              onClick={() => navigate(`/whiteboard/${roomId}`)}>
              Whiteboard
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

            <Button
              size="sm"
              variant="premium"
              px={6}
              onClick={() => codeEditorRef.current?.runCode()}>
              Execute
            </Button>
          </Box>
        </Box>

        <Box flex="1" overflow="hidden">
          {doc && provider ? (
            <CodeEditor
              ref={codeEditorRef}
              doc={doc}
              provider={provider}
              language={language}
            />
          ) : (
            <Box color="white" p={4}>Initializing Editor…</Box>
          )}
        </Box>
      </Flex>
      <AudioFooter />
    </Box>
  );
}

export default EditorPage;
