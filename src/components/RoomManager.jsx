import { Box, useToast } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api";

const RoomManager = () => {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const id = "room-" + Date.now();
      await createRoom({ roomId: id, name: roomName });
      navigate(`/editor/${id}`);
    } catch (err) {
      toast({ title: "Error creating room", status: "error" });
    }
  };

  const handleJoin = () => {
    if (!roomId) return;
    navigate(`/editor/${roomId}`);
  };

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#0f0a19"
      color="white">
      <VStack spacing={6} width="300px">
        <Heading size="md">Create Room</Heading>
        <Input
          placeholder="Room Name"
          onChange={(e) => setRoomName(e.target.value)}
        />
        <Button colorScheme="green" width="100%" onClick={handleCreate}>
          Create New Room
        </Button>
        <Heading size="md" pt={4}>
          Join Room
        </Heading>
        <Input
          placeholder="Enter Room ID"
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Button colorScheme="blue" width="100%" onClick={handleJoin}>
          Join Existing Room
        </Button>
      </VStack>
    </Box>
  );
};
export default RoomManager;
