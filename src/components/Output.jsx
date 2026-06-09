import { Box, Text, VStack, Icon, Flex } from "@chakra-ui/react";
import { FaTerminal } from "react-icons/fa";

const Output = ({ isOpen, logs }) => {
  return (
    <Box
      w="100%"
      h="100%"
      bg="obsidian.900"
      color="whiteAlpha.800"
      p={0}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      borderLeft="1px solid"
      borderColor="whiteAlpha.100"
    >
      <Flex 
        bg="whiteAlpha.100" 
        px={4} 
        py={3} 
        alignItems="center" 
        gap={2} 
        borderBottom="1px solid" 
        borderColor="whiteAlpha.100"
      >
        <Icon as={FaTerminal} size="12px" color="whiteAlpha.500" />
        <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.600" letterSpacing="widest" textTransform="uppercase">
          Terminal Console
        </Text>
      </Flex>

      <VStack 
        flex="1" 
        align="stretch" 
        p={4} 
        spacing={1} 
        overflowY="auto" 
        fontFamily="'Fira Code', 'Cascadia Code', monospace"
        fontSize="sm"
      >
        {logs && logs.length > 0 ? (
          logs.map((line, i) => (
            <Flex key={i} gap={2}>
              <Text color="accent.indigo" fontWeight="bold">{" > "}</Text>
              <Text>{line}</Text>
            </Flex>
          ))
        ) : (
          <Flex direction="column" align="center" justify="center" h="100%" color="whiteAlpha.300">
             <Text fontSize="xs" fontStyle="italic">Waiting for execution output...</Text>
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default Output;
