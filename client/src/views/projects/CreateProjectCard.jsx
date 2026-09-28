// views/projects/CreateProjectCard.jsx
import React from "react";
import { FaPlus } from "react-icons/fa6";
import { motion } from "framer-motion";

const CreateProjectCard = ({ onClick }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.div
        className="w-[220px] h-[180px] border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-white hover:from-blue-100/70 hover:via-blue-100/50 hover:to-blue-50 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-lg group"
        onClick={onClick}
        whileHover={{
          scale: window.innerWidth >= 768 ? 1.05 : 1.02,
          y: -5,
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center transition-all duration-300 rounded-full shadow-lg w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 group-hover:shadow-2xl">
          <FaPlus className="text-2xl text-white" />
        </div>
      </motion.div>

      <div className="flex flex-col items-center justify-center gap-1 min-h-[60px]">
        <span className="text-[14px] font-[500] text-[#546078] text-center mt-2">
          Add New Project
        </span>
        <span className="text-gray-400 text-[15px] font-medium text-center invisible">
          Placeholder
        </span>
      </div>
    </div>
  );
};

export default CreateProjectCard;
