import React, { useState } from "react";
import { Box, IconButton, Dialog, DialogContent } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";

const ProductImageGallery = ({
  mainImage,
  secondaryImages = [],
  title = "Product",
  height = 200,
  showThumbnails = true,
  enableZoom = true
}) => {
  // Combine main image with secondary images
  const allImages = [mainImage, ...(secondaryImages || [])].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [imageError, setImageError] = useState({});

  // Placeholder image for when no image is available
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  const handlePrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleImageError = (index) => {
    setImageError((prev) => ({ ...prev, [index]: true }));
  };

  const getCurrentImage = () => {
    if (allImages.length === 0 || imageError[currentIndex]) {
      return placeholderImage;
    }
    return allImages[currentIndex];
  };

  const hasMultipleImages = allImages.length > 1;

  return (
    <>
      {/* Main Image Container */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: height,
          bgcolor: "#f8f8f8",
          borderRadius: 1,
          overflow: "hidden",
          cursor: enableZoom ? "zoom-in" : "default",
        }}
        onClick={() => enableZoom && setZoomOpen(true)}
      >
        {/* Main Image */}
        <Box
          component="img"
          src={getCurrentImage()}
          alt={`${title} - Image ${currentIndex + 1}`}
          onError={() => handleImageError(currentIndex)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transition: "transform 0.3s ease",
            "&:hover": {
              transform: enableZoom ? "scale(1.02)" : "none",
            },
          }}
        />

        {/* Navigation Arrows - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "white" },
                boxShadow: 1,
                width: 32,
                height: 32,
              }}
              size="small"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "white" },
                boxShadow: 1,
                width: 32,
                height: 32,
              }}
              size="small"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Image Counter Badge */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {currentIndex + 1} / {allImages.length}
          </Box>
        )}

        {/* Zoom Icon */}
        {enableZoom && (
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(255,255,255,0.9)",
              "&:hover": { bgcolor: "white" },
              width: 28,
              height: 28,
            }}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(true);
            }}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Thumbnails */}
      {showThumbnails && hasMultipleImages && (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 1,
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#ccc", borderRadius: 2 },
          }}
        >
          {allImages.map((img, index) => (
            <Box
              key={index}
              onClick={() => handleThumbnailClick(index)}
              sx={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: 0.5,
                overflow: "hidden",
                cursor: "pointer",
                border: currentIndex === index ? "2px solid #003087" : "2px solid transparent",
                opacity: currentIndex === index ? 1 : 0.6,
                transition: "all 0.2s",
                "&:hover": { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={imageError[index] ? placeholderImage : img}
                alt={`Thumbnail ${index + 1}`}
                onError={() => handleImageError(index)}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Zoom/Lightbox Dialog */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.95)",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Zoomed Image */}
          <Box
            component="img"
            src={getCurrentImage()}
            alt={`${title} - Zoomed`}
            sx={{
              maxWidth: "90%",
              maxHeight: "85vh",
              objectFit: "contain",
            }}
          />

          {/* Navigation in Lightbox */}
          {hasMultipleImages && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>

              {/* Thumbnail Strip in Lightbox */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 1,
                  p: 1,
                  bgcolor: "rgba(0,0,0,0.5)",
                  borderRadius: 1,
                }}
              >
                {allImages.map((img, index) => (
                  <Box
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 0.5,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: currentIndex === index ? "2px solid white" : "2px solid transparent",
                      opacity: currentIndex === index ? 1 : 0.5,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <Box
                      component="img"
                      src={imageError[index] ? placeholderImage : img}
                      alt={`Thumbnail ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductImageGallery;
