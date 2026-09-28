// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useTeamStore } from "../stores/useTeamStore";
import { TbMailForward } from "react-icons/tb";
import { FiCheck, FiX, FiMenu, FiXCircle } from "react-icons/fi";

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
    <nav className="sticky top-0 z-50 bg-white border-b shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 text-white rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">Auth App</span>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="items-center hidden gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  isActiveLink(link.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {link.name}
                {isActiveLink(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 transition rounded-lg hover:bg-blue-50 hover:text-blue-600 md:hidden"
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
                className="relative p-2 text-gray-600 transition rounded-full hover:text-blue-600 hover:bg-blue-50"
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
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
                    <h3 className="font-semibold text-white">Invitations</h3>
                    <p className="text-xs text-blue-100">
                      Team invitations waiting for you
                    </p>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
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
              className="flex items-center gap-2 px-2 py-1 transition rounded-lg cursor-pointer hover:bg-blue-50"
            >
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.name || "User"}`
                }
                alt="avatar"
                className="object-cover w-8 h-8 border rounded-full"
              />
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
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
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-blue-50"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </Link>
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

      {/* Mobile Menu - with light blue-green background when open */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          backgroundColor: mobileMenuOpen ? "#e6f7f5" : "transparent",
        }}
      >
        <div className="px-4 py-4 space-y-1 border-t">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`block px-4 py-3 text-base font-medium transition-all duration-200 rounded-lg ${
                isActiveLink(link.path)
                  ? "text-blue-700 bg-white shadow-sm border-l-4 border-blue-500"
                  : "text-gray-700 hover:text-blue-600 hover:bg-white/70"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex-1">{link.name}</span>
                {isActiveLink(link.path) && (
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                )}
              </span>
            </Link>
          ))}

          {/* Mobile Menu Divider */}
          <div className="my-2 border-t border-blue-200/50"></div>

          {/* Mobile User Info */}
          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name || "User"}`
              }
              alt="avatar"
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
