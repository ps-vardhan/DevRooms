import {
  Box,
  Button,
  Code,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, getRoom, joinRoom, login, register } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock, FaDoorOpen, FaPlusCircle, FaCompass } from "react-icons/fa";

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [createdRoomData, setCreatedRoomData] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token"),
  );

  const handleSubmit = async () => {
    if (!authUsername.trim() || !authPassword) {
      return toast({
        title: "Missing Fields",
        description: "Please enter both username and password.",
        status: "warning",
        position: "top",
      });
    }

    try {
      const { data } = isLogin
        ? await login({ username: authUsername.trim(), password: authPassword })
        : await register({ username: authUsername.trim(), password: authPassword });

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsAuthenticated(true);
        toast({ title: "Welcome back!", status: "success", variant: "solid", position: "top" });
      } else {
        toast({
          title: "Account Created",
          description: "Please log in with your new credentials.",
          status: "success",
          position: "top"
        });
        setIsLogin(true);
        setAuthPassword("");
      }
    } catch (err) {
      const msg = err.response?.data?.msg || "Authentication failed";
      toast({ title: "Error", description: msg, status: "error", position: "top" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setAuthUsername("");
    setAuthPassword("");
  };

  const saveUserAndRedirect = async (rId) => {
    try {
      await getRoom(rId);
    } catch (err) {
      toast({
        title: "Invalid Room",
        description: "This room does not exist or has expired.",
        status: "error",
      });
      return;
    }
    navigate(`/editor/${rId}`);
  };

  const handleJoin = async () => {
    if (!roomId) return toast({ title: "Room ID Required", status: "warning" });
    if (!password) return toast({ title: "Password Required", status: "warning" });

    try {
      await joinRoom({ roomId, password });
      localStorage.setItem("current_room_pass", password);
      saveUserAndRedirect(roomId);
    } catch (err) {
      toast({
        title: "Join Failed",
        description: err.response?.data?.msg || "Could not join room.",
        status: "error",
      });
    }
  };

  const handleCreate = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const owner = storedUser?.username || "Unknown";

    try {
      const { data } = await createRoom({
        name: newRoomName || "Untitled Workspace",
        owner,
      });

      setCreatedRoomData({
        roomId: data.roomId,
        passwordKey: data.passwordKey,
      });

      onOpen();
    } catch (err) {
      toast({ title: "Creation Failed", description: "Could not create workspace.", status: "error" });
    }
  };

  const enterRoom = () => {
    if (createdRoomData) {
      localStorage.setItem("current_room_pass", createdRoomData.passwordKey);
      saveUserAndRedirect(createdRoomData.roomId);
    }
  };

  return (
    <Box
      height="100vh"
      width="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="obsidian.900"
      position="relative"
      overflow="hidden"
    >
      {/* Background Orbs */}
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        width="40%"
        height="40%"
        bgGradient="radial(accent.indigo, transparent)"
        opacity="0.15"
        filter="blur(100px)"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-10%"
        width="40%"
        height="40%"
        bgGradient="radial(accent.violet, transparent)"
        opacity="0.15"
        filter="blur(100px)"
      />

      <MotionBox
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        width={{ base: "90%", md: "480px" }}
        p={10}
        variant="glass"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        zIndex={1}
      >
        <VStack spacing={8} width="100%">
          <VStack spacing={2} textAlign="center">
            <Heading
              size="xl"
              fontWeight="bold"
              letterSpacing="tight"
              bgGradient="linear(to-r, white, whiteAlpha.600)"
              bgClip="text"
            >
              Collaborative
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.600" letterSpacing="widest" textTransform="uppercase">
              Real-time Development Suite
            </Text>
          </VStack>

          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <MotionVStack
                key="auth"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                spacing={5}
                width="100%"
              >
                <VStack spacing={3} width="100%">
                  <FormControl>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaUser} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Username"
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        _focus={{ borderColor: "accent.indigo", bg: "whiteAlpha.100" }}
                        _hover={{ borderColor: "whiteAlpha.300" }}
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaLock} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Password"
                        type="password"
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        _focus={{ borderColor: "accent.indigo", bg: "whiteAlpha.100" }}
                        _hover={{ borderColor: "whiteAlpha.300" }}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>
                </VStack>

                <Button
                  variant="premium"
                  width="100%"
                  size="lg"
                  h="60px"
                  fontSize="md"
                  onClick={handleSubmit}
                  isLoading={false}
                >
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>

                <HStack fontSize="sm">
                  <Text color="whiteAlpha.600">
                    {isLogin ? "New here?" : "Already have an account?"}
                  </Text>
                  <Button
                    variant="link"
                    color="accent.indigo"
                    onClick={() => setIsLogin(!isLogin)}
                    size="sm"
                  >
                    {isLogin ? "Join now" : "Login"}
                  </Button>
                </HStack>
              </MotionVStack>
            ) : (
              <MotionVStack
                key="workspace"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                spacing={6}
                width="100%"
              >
                <Box textAlign="center" py={2}>
                  <Text fontSize="sm" color="whiteAlpha.600">Authenticated as</Text>
                  <Text fontWeight="bold" fontSize="lg" color="white">{JSON.parse(localStorage.getItem("user"))?.username}</Text>
                </Box>

                <Tabs isFitted variant="unstyled" width="100%">
                  <TabList bg="whiteAlpha.50" p={1} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                    <Tab
                      borderRadius="lg"
                      _selected={{ bg: "whiteAlpha.200", color: "white" }}
                      color="whiteAlpha.500"
                      fontSize="sm"
                    >
                      Join
                    </Tab>
                    <Tab
                      borderRadius="lg"
                      _selected={{ bg: "whiteAlpha.200", color: "white" }}
                      color="whiteAlpha.500"
                      fontSize="sm"
                    >
                      Create
                    </Tab>
                  </TabList>

                  <TabPanels mt={4}>
                    <TabPanel p={0}>
                      <VStack spacing={4}>
                        <Input
                          placeholder="Room ID"
                          size="lg"
                          bg="whiteAlpha.50"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "accent.indigo" }}
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                        />
                        <Input
                          placeholder="Pass Key"
                          type="password"
                          size="lg"
                          bg="whiteAlpha.50"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "accent.indigo" }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                          variant="premium"
                          width="100%"
                          size="lg"
                          h="56px"
                          leftIcon={<FaDoorOpen />}
                          onClick={handleJoin}
                        >
                          Join Session
                        </Button>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={0}>
                      <VStack spacing={4}>
                        <Input
                          placeholder="Workspace Name (Optional)"
                          size="lg"
                          bg="whiteAlpha.50"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "accent.indigo" }}
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                        />
                        <Input
                          placeholder="Set Pass Key"
                          type="password"
                          size="lg"
                          bg="whiteAlpha.50"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "accent.indigo" }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                          variant="premium"
                          width="100%"
                          size="lg"
                          h="56px"
                          leftIcon={<FaPlusCircle />}
                          onClick={handleCreate}
                        >
                          Launch Workspace
                        </Button>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <Button
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="sm"
                  width="100%"
                  onClick={handleLogout}
                  color="whiteAlpha.400"
                  _hover={{ color: "red.400", bg: "whiteAlpha.50" }}
                >
                  Sign Out
                </Button>
              </MotionVStack>
            )}
          </AnimatePresence>
        </VStack>
      </MotionBox>

      {/* Footer Branding */}
      <HStack position="absolute" bottom="8" color="whiteAlpha.300" spacing={2}>
        <Icon as={FaCompass} />
        <Text fontSize="xs" fontWeight="medium" letterSpacing="widest" textTransform="uppercase">
          Antigravity Collaborative v1.0
        </Text>
      </HStack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.700" />
        <ModalContent bg="gray.900" borderColor="whiteAlpha.200" borderRadius="2xl" border="1px solid">
          <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.100" py={6}>Workspace Deployed</ModalHeader>
          <ModalBody py={8}>
            <VStack align="start" spacing={6}>
              <Text color="whiteAlpha.600" fontSize="sm">Your secure workspace is ready. Share these keys with your team to start collaborating.</Text>

              <Box width="100%">
                <Text fontSize="xs" color="whiteAlpha.400" mb={2} textTransform="uppercase" letterSpacing="widest">Room ID</Text>
                <Code width="100%" p={4} borderRadius="xl" fontSize="xl" variant="solid" colorScheme="purple">
                  {createdRoomData?.roomId}
                </Code>
              </Box>

              <Box width="100%">
                <Text fontSize="xs" color="whiteAlpha.400" mb={2} textTransform="uppercase" letterSpacing="widest">Pass Key</Text>
                <Code width="100%" p={4} borderRadius="xl" fontSize="xl" variant="solid" colorScheme="indigo">
                  {createdRoomData?.passwordKey}
                </Code>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter pb={8}>
            <Button variant="premium" width="100%" size="lg" h="56px" onClick={enterRoom}>
              Enter Workspace
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LoginPage;
