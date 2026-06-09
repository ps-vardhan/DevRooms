import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Icon,
} from "@chakra-ui/react";
import { Language_Versions } from "../constants";
import { FaChevronDown } from "react-icons/fa";

const languages = Object.entries(Language_Versions);

const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box>
      <Menu isLazy placement="bottom" gutter={12}>
        <MenuButton
          as={Button}
          variant="glass"
          size="sm"
          rightIcon={<FaChevronDown size={10} />}
          px={4}
          minW="140px"
          textAlign="left"
          fontWeight="semibold"
          fontSize="xs"
          letterSpacing="wide"
          textTransform="uppercase"
        >
          {language}
        </MenuButton>

        <MenuList
          bg="gray.900"
          borderColor="whiteAlpha.100"
          boxShadow="dark-lg"
          p={1}
          minW="180px"
          zIndex={100}
        >
          {languages.map(([lang, version]) => (
            <MenuItem
              key={lang}
              onClick={() => onSelect(lang)}
              borderRadius="lg"
              mb={1}
              py={2}
              px={3}
              bg={lang === language ? "whiteAlpha.100" : "transparent"}
              color={lang === language ? "accent.indigo" : "whiteAlpha.800"}
              _hover={{
                bg: "whiteAlpha.200",
                color: "white",
              }}
              fontSize="sm"
              fontWeight={lang === language ? "bold" : "medium"}
            >
              <Box flex="1">{lang}</Box>
              <Text as="span" color="whiteAlpha.400" fontSize="xs" fontWeight="normal">
                {version}
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
