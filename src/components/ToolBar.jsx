import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Tooltip,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { FaUndo, FaRedo, FaTrash, FaDownload, FaEraser, FaPaintBrush, FaSearchPlus, FaSearchMinus } from "react-icons/fa";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

const ToolBar = ({
  color,
  setColor,
  brushSize,
  setBrushSize,
  brushType,
  setBrushType,
  handleClear,
  isEraser,
  toggleEraser,
  handleUndo,
  canUndo,
  handleRedo,
  canRedo,
  handleSave,
  zoom,
  setZoom,
}) => {
  return (
    <MotionBox
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      position="absolute"
      top="0"
      bottom="0"
      my="auto"
      right="24px"
      height="fit-content"
      zIndex={100}
      p={4}
      backdropFilter="blur(20px)"
      bg="rgba(15, 10, 25, 0.85)"
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="full"
      boxShadow="0 20px 40px rgba(0,0,0,0.5)"
      width="76px"
    >
      <VStack spacing={3}>
        <Tooltip label="Brush Type" placement="left">
          <Popover placement="left" gutter={12}>
            <PopoverTrigger>
              <IconButton
                aria-label="Brush Type"
                icon={<FaPaintBrush />}
                variant="ghost"
                colorScheme="purple"
                color="whiteAlpha.800"
                _hover={{ bg: "whiteAlpha.200", color: "white" }}
                size="md"
              />
            </PopoverTrigger>
            <PopoverContent bg="gray.900" borderColor="whiteAlpha.100" color="white" width="200px">
              <PopoverArrow bg="gray.900" />
              <PopoverCloseButton />
              <PopoverHeader border="none" fontSize="sm" fontWeight="bold">Select Brush</PopoverHeader>
              <PopoverBody p={2}>
                <VStack spacing={1} align="stretch">
                  {["default", "rectangle", "circle", "calligraphy", "splatter", "watercolor", "neon", "glitch"].map(t => (
                    <Box
                      key={t}
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                      bg={brushType === t ? "purple.600" : "transparent"}
                      _hover={{ bg: brushType === t ? "purple.500" : "whiteAlpha.100" }}
                      onClick={() => setBrushType(t)}
                      fontSize="xs"
                      textTransform="capitalize"
                    >
                      {t}
                    </Box>
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Tooltip>

        <Tooltip label="Brush Color" placement="left">
          <Box position="relative">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                background: "none",
                padding: 0,
              }}
            />
          </Box>
        </Tooltip>

        <Divider borderColor="whiteAlpha.100" />

        <Tooltip label={`Size: ${brushSize}px`} placement="left">
          <Box height="120px" py={2}>
            <Slider
              value={brushSize}
              min={1}
              max={100}
              onChange={setBrushSize}
              orientation="vertical"
            >
              <SliderTrack bg="whiteAlpha.200" borderRadius="full">
                <SliderFilledTrack bgGradient="linear(to-t, accent.indigo, accent.violet)" />
              </SliderTrack>
              <SliderThumb boxSize={4} bg="white" boxShadow="lg" />
            </Slider>
          </Box>
        </Tooltip>

        <Divider borderColor="whiteAlpha.100" />

        <Tooltip label="Eraser" placement="left">
          <IconButton
            aria-label="Eraser"
            icon={<FaEraser />}
            onClick={toggleEraser}
            variant={isEraser ? "solid" : "ghost"}
            colorScheme={isEraser ? "red" : "whiteAlpha"}
            size="md"
            _hover={!isEraser ? { bg: "whiteAlpha.200" } : {}}
          />
        </Tooltip>

        <Tooltip label="Undo" placement="left">
          <IconButton
            aria-label="Undo"
            icon={<FaUndo />}
            onClick={handleUndo}
            isDisabled={!canUndo}
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200", color: "white" }}
            size="md"
          />
        </Tooltip>

        <Tooltip label="Redo" placement="left">
          <IconButton
            aria-label="Redo"
            icon={<FaRedo />}
            onClick={handleRedo}
            isDisabled={!canRedo}
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200", color: "white" }}
            size="md"
          />
        </Tooltip>

        <Divider borderColor="whiteAlpha.100" />

        <Tooltip label="Zoom In" placement="left">
          <IconButton
            aria-label="Zoom In"
            icon={<FaSearchPlus />}
            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            variant="ghost"
            size="md"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200" }}
          />
        </Tooltip>

        <Tooltip label="Zoom Out" placement="left">
          <IconButton
            aria-label="Zoom Out"
            icon={<FaSearchMinus />}
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            variant="ghost"
            size="md"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200" }}
          />
        </Tooltip>

        <Divider borderColor="whiteAlpha.100" />

        <Tooltip label="Download Image" placement="left">
          <IconButton
            aria-label="Download"
            icon={<FaDownload />}
            onClick={handleSave}
            variant="ghost"
            colorScheme="teal"
            color="accent.emerald"
            _hover={{ bg: "emerald.900", color: "white" }}
            size="md"
          />
        </Tooltip>

        <Tooltip label="Clear Canvas" placement="left">
          <IconButton
            aria-label="Clear"
            icon={<FaTrash />}
            onClick={handleClear}
            variant="ghost"
            colorScheme="red"
            color="accent.rose"
            _hover={{ bg: "rose.900", color: "white" }}
            size="md"
          />
        </Tooltip>
      </VStack>
    </MotionBox>
  );
};

export default ToolBar;
