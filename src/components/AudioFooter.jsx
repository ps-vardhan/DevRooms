import { Avatar, AvatarGroup, Box, Flex, IconButton, Text, Tooltip, Badge, VStack, HStack, Icon } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaUsers, FaCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Peer from "simple-peer";
import { io } from "socket.io-client";
import { SERVER_HTTP_URL } from "../config.js";
import { motion } from "framer-motion";

const socket = io(SERVER_HTTP_URL);
const MotionBox = motion.create(Box);

const AudioFooter = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState({ username: "You" });
  const [peers, setPeers] = useState([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const peersRef = useRef([]);
  const userStream = useRef();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("AudioFooter:failed to parse stored user", e);
    }
  }, []);

  useEffect(() => {
    let cleanupFn;

    const setup = async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
      } catch (err) {
        console.error("AudioFooter:mic acess denied", err);
        return;
      }
      userStream.current = stream;

      const handleAllUsers = (users) => {
        peersRef.current.forEach((p) => p.peer.destroy());
        peersRef.current = [];

        const nextPeers = users
          .filter(({ socketId }) => socketId !== socket.id)
          .map(({ socketId, username }) => {
            const peer = createPeer(socketId, socket.id, stream);
            const entry = { peerID: socketId, username, peer };
            peersRef.current.push(entry);
            return entry;
          });

        setPeers(nextPeers);
      };

      const handleUserJoined = ({ signal, callerID, username }) => {
        const item = peersRef.current.find((p) => p.peerID === callerID);
        if (item) return;

        const peer = addPeer(signal, callerID, stream);
        const entry = { peerID: callerID, username, peer };
        peersRef.current.push(entry);
        setPeers((prev) => [...prev, entry]);
      };

      const handleReturnSignal = ({ id, signal }) => {
        const item = peersRef.current.find((p) => p.peerID === id);
        if (item) item.peer.signal(signal);
      };

      const handleUserLeft = (socketId) => {
        const entry = peersRef.current.find((p) => p.peerID === socketId);
        if (entry) entry.peer.destroy();
        peersRef.current = peersRef.current.filter(
          (p) => p.peerID !== socketId,
        );
        setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
      };

      socket.on("all users", handleAllUsers);
      socket.on("user joined", handleUserJoined);
      socket.on("receiving returned signal", handleReturnSignal);
      socket.on("user left", handleUserLeft);

      const username = (() => {
        try {
          return JSON.parse(localStorage.getItem("user"))?.username || "Guest";
        } catch {
          return "Guest";
        }
      })();

      socket.emit("join room", { roomId, username });

      cleanupFn = () => {
        socket.off("all users", handleAllUsers);
        socket.off("user joined", handleUserJoined);
        socket.off("receiving returned signal", handleReturnSignal);
        socket.off("user left", handleUserLeft);

        peersRef.current.forEach((p) => p.peer.destroy());
        peersRef.current = [];
        setPeers([]);

        if (userStream.current) {
          userStream.current.getTracks().forEach((t) => t.stop());
          userStream.current = null;
        }
      };
    };
    setup();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [roomId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal });
    });

    peer.on("error", (err) => {
      console.error("AudioFooter:peer error (initiator)", err);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.on("error", (err) => {
      console.error("AudioFooter:peer error (receiver)", err);
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleMute = () => {
    if (!userStream.current) return;
    const track = userStream.current.getAudioTracks()[0];
    if (!track) return;

    track.enabled = isMicMuted;
    setIsMicMuted((m) => !m);
  };

  const leaveRoom = () => {
    if (userStream.current) {
      userStream.current.getTracks().forEach((t) => t.stop());
    }
    navigate("/");
  };

  return (
    <MotionBox
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      position="fixed"
      bottom="24px"
      left="0"
      right="0"
      mx="auto"
      zIndex={1000}
      px={10}
      py={4}
      bg="rgba(10, 10, 30, 0.85)"
      backdropFilter="blur(25px)"
      borderRadius="full"
      border="1px solid"
      borderColor="accent.indigo"
      boxShadow="0 15px 40px rgba(0,0,0,0.6)"
      width="fit-content"
      minW={{ base: "90%", md: "700px" }}
    >
      <Flex alignItems="center" justifyContent="space-between" width="100%">
        {/* User Info Section */}
        <Flex alignItems="center" gap={4} flex="1">
          <Box position="relative">
            <Avatar
              size="sm"
              name={currentUser.username}
              bgGradient="linear(to-br, accent.indigo, accent.violet)"
              color="white"
            />
            <Icon
              as={FaCircle}
              position="absolute"
              bottom="-1px"
              right="-1px"
              color={isMicMuted ? "red.500" : "green.400"}
              boxSize="10px"
              border="2px solid"
              borderColor="gray.900"
            />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="xs" color="white" letterSpacing="widest" textTransform="uppercase">
              {currentUser.username}
            </Text>
            <HStack spacing={1}>
              <Icon as={FaCircle} boxSize="6px" color="green.400" />
              <Text fontSize="9px" color="whiteAlpha.600" fontWeight="medium">Voice Connected</Text>
            </HStack>
          </VStack>
        </Flex>

        {/* Central Controls SECTION - Centered */}
        <Flex gap={5} alignItems="center" justifyContent="center">
          <Tooltip label={isMicMuted ? "Power On Mic" : "Mute Session"} placement="top" hasArrow>
            <IconButton
              aria-label="Toggle Mic"
              icon={isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              onClick={toggleMute}
              variant={isMicMuted ? "solid" : "glass"}
              colorScheme={isMicMuted ? "red" : "whiteAlpha"}
              isRound
              size="lg"
              boxShadow={!isMicMuted ? "0 0 15px rgba(255,255,255,0.1)" : "none"}
              _hover={{ transform: "translateY(-4px) scale(1.1)", bg: isMicMuted ? "red.600" : "whiteAlpha.300" }}
              transition="all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            />
          </Tooltip>

          <Tooltip label="Leave Workspace" placement="top" hasArrow>
            <IconButton
              aria-label="Exit"
              icon={<FaPhoneSlash />}
              onClick={leaveRoom}
              variant="outline"
              colorScheme="red"
              borderColor="red.500"
              color="red.400"
              isRound
              size="lg"
              _hover={{ bg: "red.500", color: "white", transform: "translateY(-4px) scale(1.1)", boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)" }}
              transition="all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            />
          </Tooltip>
        </Flex>

        {/* Right Section - Collaborators */}
        <Flex alignItems="center" gap={6} flex="1" justifyContent="flex-end">
          <Divider orientation="vertical" height="30px" borderColor="whiteAlpha.200" />
          <VStack align="end" spacing={1}>
            <HStack spacing={2} color="accent.indigo">
              <Icon as={FaUsers} boxSize="12px" />
              <Text fontSize="10px" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                Network
              </Text>
            </HStack>
            <AvatarGroup size="xs" max={4} spacing={-2}>
              {peers.map((p) => (
                <Tooltip key={p.peerID} label={p.username} placement="top" hasArrow>
                  <Avatar name={p.username} border="2px solid" borderColor="gray.900" />
                </Tooltip>
              ))}
            </AvatarGroup>
          </VStack>
        </Flex>
      </Flex>

      {peers.map((p) => (
        <AudioPlayer key={p.peerID} peer={p.peer} />
      ))}
    </MotionBox>
  );
};

const Divider = ({ orientation = "horizontal", height, borderColor }) => (
  <Box
    w={orientation === "horizontal" ? "100%" : "1px"}
    h={orientation === "vertical" ? height : "1px"}
    bg={borderColor}
  />
);

const AudioPlayer = ({ peer }) => {
  const audioRef = useRef();
  useEffect(() => {
    peer.on("stream", (remoteStream) => {
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStream;
      }
    });
  }, [peer]);
  return <audio playsInline autoPlay ref={audioRef} />;
};

export default AudioFooter;
