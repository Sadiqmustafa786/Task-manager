import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { teamService } from "../../services/team.service";

export default function InvitationView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?returnTo=${encodeURIComponent(`/invite/accept/${token}`)}`, { replace: true });
    }
  }, [loading, user, navigate, token]);

  const accept = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await teamService.acceptInvitation(token);
      navigate(`/teams?teamId=${encodeURIComponent(result.team._id)}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not accept this invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-gray-600">Reviewing your invitation...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
        <h1 className="mb-3 text-2xl font-semibold text-gray-900">Team invitation</h1>
        <p className="mb-6 text-gray-600">You have been invited to join a team. Accept to continue to that team.</p>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="flex justify-center gap-3">
          <button onClick={accept} disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Accepting..." : "Accept invitation"}
          </button>
          <Link to="/teams" className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700">Later</Link>
        </div>
      </div>
    </div>
  );
}
