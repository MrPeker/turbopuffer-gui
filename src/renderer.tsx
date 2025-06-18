import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Provider,
  defaultTheme,
  Button,
  Flex,
  Heading,
  View,
} from "@adobe/react-spectrum";

function App() {
  return (
    <Provider theme={defaultTheme} height="100%">
      <View height="100%" padding="size-300">
        <Flex direction="column" gap="size-200">
          <Heading level={1}>Turbopuffer GUI</Heading>
          <Button
            variant="accent"
            onPress={() => alert("Welcome to Turbopuffer GUI!")}
          >
            Hello React Spectrum!
          </Button>
        </Flex>
      </View>
    </Provider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
