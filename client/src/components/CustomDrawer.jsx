import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showFooter = false,
  footerContent = null,
  className = "",
}) => {
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return position === "right" || position === "left" ? "w-80" : "h-80";
      case "md":
        return position === "right" || position === "left" ? "w-96" : "h-96";
      case "lg":
        return position === "right" || position === "left"
          ? "w-[500px]"
          : "h-[500px]";
      case "xl":
        return position === "right" || position === "left"
          ? "w-[600px]"
          : "h-[600px]";
      case "full":
        return position === "right" || position === "left"
          ? "w-full"
          : "h-full";
      default:
        return position === "right" || position === "left" ? "w-96" : "h-96";
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case "right":
        return "top-0 right-0 h-full";
      case "left":
        return "top-0 left-0 h-full";
      case "top":
        return "top-0 left-0 w-full";
      case "bottom":
        return "bottom-0 left-0 w-full";
      default:
        return "top-0 right-0 h-full";
    }
  };

  // Get animation variants
  const getAnimationVariants = () => {
    switch (position) {
      case "right":
        return {
          hidden: { x: "100%" },
          visible: { x: 0 },
          exit: { x: "100%" },
        };
      case "left":
        return {
          hidden: { x: "-100%" },
          visible: { x: 0 },
          exit: { x: "-100%" },
        };
      case "top":
        return {
          hidden: { y: "-100%" },
          visible: { y: 0 },
          exit: { y: "-100%" },
        };
      case "bottom":
        return {
          hidden: { y: "100%" },
          visible: { y: 0 },
          exit: { y: "100%" },
        };
      default:
        return {
          hidden: { x: "100%" },
          visible: { x: 0 },
          exit: { x: "100%" },
        };
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Drawer */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getAnimationVariants()}
            transition={{ type: "tween", duration: 0.3 }}
            className={`fixed z-50 bg-white shadow-2xl ${getPositionClasses()} ${getSizeClasses()} ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
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

            {/* Content */}
            <div
              className="flex-1 px-6 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(100% - 120px)" }}
            >
              {children}
            </div>

            {/* Footer */}
            {showFooter && footerContent && (
              <div className="px-6 py-4 border-t border-gray-200">
                {footerContent}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomDrawer;
