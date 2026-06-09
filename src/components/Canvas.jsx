import React, { useEffect, useRef } from "react";
import "../styles/Canvas.css";
import { brushHandlers } from "./brushes";

const Canvas = React.forwardRef(
  (
    {
      color,
      brushSize,
      brushType = "default",
      onSaveState,
      historyImage,
      width,
      height,
      zoom = 1,
      isEraser,
      doc,
    },
    forwardedRef
  ) => {
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPositionRef = useRef({ x: 0, y: 0 });
    const lastTimeRef = useRef(0);

    const yPaintRef = useRef(null);

    useEffect(() => {
      if (doc) {
        yPaintRef.current = doc.getArray("paint-ops");
      }
    }, [doc]);

    useEffect(() => {
      if (forwardedRef) {
        forwardedRef.current = canvasRef.current;
      }
    }, [forwardedRef]);

    const drawWatermark = (ctx) => {
      ctx.save();
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Rotate around center
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 4); // -45 degrees
      ctx.translate(-width / 2, -height / 2);

      // Grid loop to cover the canvas (including rotation buffer)
      const diagonal = Math.sqrt(width * width + height * height);
      const spacingX = 150; // Horizontal space between words
      const spacingY = 100; // Vertical space between lines

      // Loop over a large area to ensure coverage after rotation
      for (let x = -diagonal; x < width + diagonal; x += spacingX) {
        for (let y = -diagonal; y < height + diagonal; y += spacingY) {
          ctx.fillText("PAINT", x, y);
        }
      }

      ctx.restore();
    };

    // 1. Generate Watermark Background (Css Layer)
    useEffect(() => {
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");

      // Fill White Base for Background
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, width, height);
      drawWatermark(tempCtx);

      canvas.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
      canvas.style.backgroundSize = "cover";
    }, [width, height]);

    // 2. Init Canvas (Transparent)
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      // context.fillStyle = "#ffffff";
      // context.fillRect(0, 0, canvas.width, canvas.height);

      // drawWatermark(context);

      // Clear to Transparent
      context.clearRect(0, 0, width, height);

      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "black";
      context.lineWidth = 5;
    }, [width, height]);


    useEffect(() => {
      if (historyImage) {
        const context = canvasRef.current.getContext("2d");
        const img = new Image();
        img.src = historyImage;
        img.onload = () => {
          context.clearRect(0, 0, width, height);
          context.drawImage(img, 0, 0);
        };
      }
    }, [historyImage, width, height]);

    useEffect(() => {
      if (!yPaintRef.current || !canvasRef.current) return;

      const yArray = yPaintRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      console.log("Canvas: Observing Yjs array");
      const observer = (event) => {
        console.log("Canvas: Yjs event received", event);
        event.changes.added.forEach((item) => {
          console.log("Canvas: Remote update received");
          if (event.transaction.local) return;

          item.content.getContent().forEach((op) => {
            console.log("Canvas: Drawing remote op", op);
            performDraw(context, op);
          });
        });
        if (event.changes.deleted.size > 0 && yArray.length === 0) {
          if (!event.transaction.local) {
            console.log("Canvas: Remote clear received");
            context.clearRect(0, 0, width, height);
          }
        }
      };

      console.log("Canvas: Attaching observer to Yjs array, current length:", yArray.length);
      // Draw existing content on load
      if (yArray.length > 0) {
        console.log("Canvas: Loading existing strokes...", yArray.length);
        yArray.forEach(op => {
          // Handle array of ops if it's pushed as an array, or single op
          // The push was: yPaintRef.current.push([op]); -> So Y.Array contains items.
          // Wait, yArray.push([content]) pushes content types.
          // If we pushed a JSON object, it's a Y.Map or just JSON?
          // Yjs push accepts content.
          // Let's inspect the item.
          performDraw(context, op);
        })
      }


      // // Draw existing content on load
      // if (yArray.length > 0) {
      //   console.log("Canvas: Loading existing strokes...", yArray.length);
      //   yArray.forEach(op => {
      //     performDraw(context, op);
      //   });
      // }

      yArray.observe(observer);
      return () => {
        console.log("Canvas: Unobserving Yjs array");
        yArray.unobserve(observer);
      };
    }, [width, height, doc]);

    const performDraw = (context, op) => {
      const { type, start, end, color: opColor, size, isEraser: opIsErazer, brushType: opBrushType } = op;

      context.save();

      if (opIsErazer) {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }

      if (opBrushType === "rectangle" || opBrushType === "circle") {
        drawShape(context, start, end, opBrushType, opColor);
      } else {
        const brushHandler = brushHandlers[opBrushType] || brushHandlers.default;
        brushHandler(context, { start: start, end: end, color: opColor, size: size, lastTime: 0 });
      }
      context.restore();
    };


    const drawShape = (context, start, end, type, color) => {
      context.beginPath();
      context.strokeStyle = color;
      context.fillStyle = color;
      const width = end.x - start.x;
      const height = end.y - start.y;

      if (type === "rectangle") {
        context.strokeRect(start.x, start.y, width, height);
      } else if (type === "circle") {
        const radius = Math.sqrt(width * width + height * height);
        context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        context.stroke();
      }
    };

    const handleMouseDown = (e) => {
      const currentPosition = {
        x: e.nativeEvent.offsetX / zoom,
        y: e.nativeEvent.offsetY / zoom,
      };
      lastPositionRef.current = currentPosition;
      isDrawingRef.current = true;
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // === ERASER UPDATE ===
      // If brushType is 'eraser' (or special eraser mode), use 'destination-out'
      if (isEraser) {
        // New Logic: Erase to Transparent
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }

      /*
      if (isEraser) {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }
      */

      const currentPosition = {
        x: e.nativeEvent.offsetX / zoom,
        y: e.nativeEvent.offsetY / zoom,
      };

      if (brushType === "rectangle" || brushType === "circle") {
        // Shape logic...
        context.clearRect(0, 0, width, height);

        if (historyImage) {
          const img = new Image();
          img.src = historyImage;
          context.drawImage(img, 0, 0);
        }

        // Reset composite operation for shapes just in case
        context.globalCompositeOperation = "source-over";

        drawShape(
          context,
          lastPositionRef.current,
          currentPosition,
          brushType,
          color
        );
      } else {
        const brushHandler = brushHandlers[brushType] || brushHandlers.default;

        brushHandler(context, {
          start: lastPositionRef.current,
          end: currentPosition,
          color,
          size: brushSize,
          lastTime: lastTimeRef.current,
        });

        if (yPaintRef.current) {
          const op = {
            type: 'draw',
            start: lastPositionRef.current,
            end: currentPosition,
            color: color,
            size: brushSize,
            isEraser: isEraser,
            brushType: brushType,
          };
          console.log("Canvas: Pushing local op", op);
          yPaintRef.current.push([op]);
        }
        lastPositionRef.current = currentPosition;
        lastTimeRef.current = Date.now();

        // Reset composite operation after drawing
        context.globalCompositeOperation = "source-over";
      }
    };

    const handleMouseUp = (e) => {
      if (isDrawingRef.current && (brushType === "rectangle" || brushType === "circle")) {
        const currentPosition = {
          x: e.nativeEvent.offsetX / zoom,
          y: e.nativeEvent.offsetY / zoom,
        };
        if (yPaintRef.current) {
          const op = {
            type: 'shape',
            start: lastPositionRef.current,
            end: currentPosition,
            color: color,
            isEraser: isEraser,
            brushType: brushType,
            size: brushSize
          };
          yPaintRef.current.push([op]);
        }
      }


      isDrawingRef.current = false;
      if (onSaveState) {
        onSaveState(canvasRef.current.toDataURL());
      }
    };

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="canvas"
        width={width}
        height={height}
        style={{
          width: `${width * zoom}px`,
          height: `${height * zoom}px`,
          background: "white",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06)",
        }}
      ></canvas>
    );
  }
);

export default Canvas;
