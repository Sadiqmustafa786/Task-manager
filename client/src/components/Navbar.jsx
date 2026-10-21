// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useTeamStore } from "../stores/useTeamStore";
import { TbMailForward } from "react-icons/tb";
import { FiCheck, FiX, FiMenu, FiXCircle } from "react-icons/fi";
import defaultAvatar from "../assets/DP.jpg";
import taskoraLogo from "../assets/taskora-icon.png";
import "./Navbar.css";

const Navbar = () => {
  const { logout, user } = useAuthStore();
  const { invitations, fetchInvitations, loading } = useTeamStore();
  const [open, setOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navLinks = [
    { name: "Home", path: "/dashboard" },
    { name: "Teams", path: "/teams" },
    { name: "Workflows", path: "/workflows" },
    { name: "Projects", path: "/projects" },

    { name: "Statistics", path: "/statistics" },
  ];

  // Fetch invitations when dropdown opens
  useEffect(() => {
    if (invitationOpen) {
      fetchInvitations();
    }
  }, [invitationOpen, fetchInvitations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setInvitationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleAccept = (invitation) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/teams/invite/accept/${invitation.token}`;
  };

  const handleReject = (invitation) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/teams/invite/reject/${invitation.token}`;
  };

  const isActiveLink = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav className="navbar-root sticky top-0 z-50">
      <div className="navbar-shell mx-auto">
        <svg
          className="navbar-wave"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="navbar-blue-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#2391FF" />
              <stop offset="100%" stopColor="#1269C7" />
            </linearGradient>
          </defs>
          <path
            d="M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z"
            fill="#1675D1"
            transform="translate(0 -5)"
          >
            <animate
              attributeName="d"
              dur="7s"
              repeatCount="indefinite"
              values="M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z;M470 0C390 24 350 36 285 64C220 94 170 91 0 100H800V0H470Z;M470 0C390 -8 350 72 285 88C220 104 170 58 0 100H800V0H470Z;M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z"
              keyTimes="0;0.34;0.68;1"
              calcMode="spline"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
            />
          </path>
          <path
            d="M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z"
            fill="url(#navbar-blue-gradient)"
          >
            <animate
              attributeName="d"
              dur="8.5s"
              repeatCount="indefinite"
              values="M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z;M470 0C390 -5 350 69 285 88C220 106 170 61 0 100H800V0H470Z;M470 0C390 21 350 40 285 66C220 94 170 90 0 100H800V0H470Z;M470 0C390 4 350 56 285 78C220 100 170 72 0 100H800V0H470Z"
              keyTimes="0;0.34;0.68;1"
              calcMode="spline"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
            />
          </path>
        </svg>
        <div className="navbar-content flex items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src={taskoraLogo}
                alt="Taskora"
                className="h-11 w-11 object-contain"
              />
              <span className="navbar-brand text-xl font-bold text-gray-800">
                Taskora
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="navbar-links items-center hidden gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`navbar-link relative px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActiveLink(link.path)
                    ? "text-[#2391FF]"
                    : "text-gray-700 hover:text-[#2391FF]"
                }`}
              >
                {link.name}
                {isActiveLink(link.path) && (
                  <span className="navbar-active-indicator absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#2391FF]"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="navbar-actions relative flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="navbar-icon-button p-2 text-white transition rounded-full hover:bg-white/15 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <FiXCircle className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>

            {/* Invitation Icon with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setInvitationOpen(!invitationOpen)}
                className="navbar-icon-button relative p-2 text-white transition rounded-full hover:bg-white/15"
                aria-label="Invitations"
              >
                <TbMailForward className="w-5 h-5" />
                {invitations?.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {invitations.length}
                  </span>
                )}
              </button>

              {/* Invitation Dropdown Menu */}
              {invitationOpen && (
                <div className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl w-80 top-full">
                  <div className="px-4 py-3 bg-gradient-to-r from-[#2391FF] to-blue-700">
                    <h3 className="font-semibold text-white">Invitations</h3>
                    <p className="text-xs text-blue-100">
                      Team invitations waiting for you
                    </p>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-b-2 border-[#2391FF] rounded-full animate-spin"></div>
                      </div>
                    ) : !invitations || invitations.length === 0 ? (
                      <div className="py-8 text-center">
                        <TbMailForward className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          No pending invitations
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          When you receive invitations, they'll appear here
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {invitations.map((invitation) => (
                          <div
                            key={invitation._id}
                            className="p-4 transition hover:bg-gray-50"
                          >
                            <div className="flex flex-col gap-3">
                              <p className="text-sm font-semibold text-gray-800">
                                {invitation.team?.name}
                              </p>
                              <div className="flex items-center gap-2">
                                {invitation.invitedBy?.avatar ? (
                                  <img
                                    src={invitation.invitedBy.avatar}
                                    alt={invitation.invitedBy.name}
                                    referrerPolicy="no-referrer"
                                    className="object-cover w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div
                                    className="flex items-center justify-center w-6 h-6 text-white rounded-full bg-gray-400 text-[8px] font-medium"
                                    style={{
                                      backgroundColor:
                                        invitation.invitedBy?.color ||
                                        "#9CA3AF",
                                    }}
                                  >
                                    {invitation.invitedBy?.name
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
                                  </div>
                                )}
                                <p className="text-xs text-gray-500">
                                  Invited by:{" "}
                                  {invitation.invitedBy?.name || "Unknown"}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-around gap-2 mt-3">
                              <button
                                onClick={() => handleAccept(invitation)}
                                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-600 transition bg-gray-100 rounded-full hover:bg-green-50"
                              >
                                <FiCheck size={16} /> Accept
                              </button>
                              <button
                                onClick={() => handleReject(invitation)}
                                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 transition bg-gray-100 rounded-full hover:bg-red-50"
                              >
                                <FiX size={16} /> Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {invitations && invitations.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={fetchInvitations}
                        className="w-full text-xs text-center text-blue-600 hover:text-blue-700"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div
              onClick={() => setOpen(!open)}
              className="navbar-user flex items-center gap-2 px-2 py-1 transition rounded-full cursor-pointer hover:bg-white/15"
            >
              <img
                src={user?.avatar || defaultAvatar}
                alt={`${user?.name || "User"}'s profile`}
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = defaultAvatar;
                }}
                className="object-cover w-8 h-8 border rounded-full"
              />
              <span className="hidden text-sm font-medium text-white sm:block">
                {user?.name || "User"}
              </span>
            </div>

            {/* User Dropdown */}
            {open && (
              <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border shadow-lg top-full rounded-xl">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="font-semibold text-gray-700 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`navbar-mobile-menu mx-auto md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-1 border-t">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-lg ${
                isActiveLink(link.path)
                  ? "text-[#2391FF] bg-white shadow-sm border-l-4 border-[#2391FF]"
                  : "text-gray-700 hover:text-[#2391FF] hover:bg-white/70"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex-1">{link.name}</span>
                {isActiveLink(link.path) && (
                  <span className="w-1.5 h-1.5 bg-[#2391FF] rounded-full"></span>
                )}
              </span>
            </Link>
          ))}

          {/* Mobile Menu Divider */}
          <div className="my-2 border-t border-blue-200/50"></div>

          {/* Mobile User Info */}
          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={user?.avatar || defaultAvatar}
              alt={`${user?.name || "User"}'s profile`}
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = defaultAvatar;
              }}
              className="object-cover w-8 h-8 border rounded-full"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Mobile Logout */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm text-red-500 transition rounded-lg hover:bg-red-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
