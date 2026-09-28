// components/CustomModal.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  position = "center", // 'center' or 'right'
  fullScreen = false, // Add this prop for full-screen mode
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showFooter = false,
  footerContent = null,
  className = "",
  titleClassName = "",
  contentClassName = "",
  footerClassName = "",
}) => {
  const getSizeClasses = () => {
    if (fullScreen) {
      return "w-full h-full";
    }
    switch (size) {
      case "sm":
        return "max-w-md";
      case "md":
        return "max-w-lg";
      case "lg":
        return "max-w-2xl";
      case "xl":
        return "max-w-4xl";
      case "full":
        return "max-w-[90vw] w-full";
      default:
        return "max-w-lg";
    }
  };

  const getPositionClasses = () => {
    if (position === "right") {
      return "justify-end";
    }
    return "justify-center";
  };

  const getAnimationProps = () => {
    if (position === "right") {
      return {
        initial: { opacity: 0, x: "100%" },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: "100%" },
      };
    }
    return {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    };
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEscape, onClose]);

  const animationProps = getAnimationProps();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only show if not fullScreen */}
          {!fullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={closeOnBackdrop ? onClose : undefined}
            />
          )}

          {/* Modal */}
          <motion.div
            initial={animationProps.initial}
            animate={animationProps.animate}
            exit={animationProps.exit}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed inset-0 z-50 flex items-center ${getPositionClasses()} ${className}`}
          >
            <div
              className={`bg-white shadow-xl ${getSizeClasses()} ${fullScreen ? "rounded-none" : "rounded-lg"} flex flex-col ${
                fullScreen && position === "right" ? "h-full" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b border-gray-200">
                <h2
                  className={`text-xl font-semibold text-gray-800 ${titleClassName}`}
                >
                  {title}
                </h2>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Scrollable Content */}
              <div
                className={`flex-1 overflow-y-auto px-6 py-4 ${contentClassName}`}
              >
                {children}
              </div>

              {/* Footer */}
              {showFooter && footerContent && (
                <div
                  className={`px-6 py-4 border-t border-gray-200 flex-shrink-0 ${footerClassName}`}
                >
                  {footerContent}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
