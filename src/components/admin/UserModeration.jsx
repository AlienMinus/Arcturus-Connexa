import React from 'react';
import { FaUsers, FaSyncAlt, FaUserCheck } from 'react-icons/fa';

const UserModeration = ({ usersList = [], loading, onToggleVerify }) => {
  return (
    <section className="adminSectionPanel">
      <div className="panelHeaderRow">
        <h3>Registered Members ({usersList.length})</h3>
        <p>Manage user accounts, roles, and verification badges.</p>
      </div>

      {loading ? (
        <div className="adminLoadingState">
          <FaSyncAlt className="spinAnimation" size={24} />
          <p>Loading users...</p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="adminEmptyState">
          <FaUsers size={42} />
          <h3>No users found</h3>
        </div>
      ) : (
        <div className="adminTableContainer">
          <table className="adminDataTable">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email & Handle</th>
                <th>Role</th>
                <th>Organizations</th>
                <th>Verified Badge</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="tableUserCol">
                      {u.profilePicture?.url ? (
                        <img src={u.profilePicture.url} alt={u.firstName} className="tableAvatar" />
                      ) : (
                        <div className="tableAvatarFallback">{u.firstName?.[0] || 'U'}</div>
                      )}
                      <div>
                        <strong>{u.firstName} {u.lastName}</strong>
                        <p className="tableUserHeadline">{u.headline || 'Member'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{u.email}</span>
                    <span className="tableSubtext">@{u.username || 'user'}</span>
                  </td>
                  <td>
                    <span className={`roleTag ${u.role || 'user'}`}>
                      {u.role === 'admin' || u.username === 'arcturus_admin' ? '🛡️ Admin' : 'Member'}
                    </span>
                  </td>
                  <td>
                    {u.organizations?.length > 0 ? (
                      <span className="orgCountPill">
                        {u.organizations.length} company
                      </span>
                    ) : (
                      <span className="textMuted">None</span>
                    )}
                  </td>
                  <td>
                    <span className={`verifiedBadgeTag ${u.isVerified ? 'verified' : 'unverified'}`}>
                      {u.isVerified ? '✔️ Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="tableActionBtn"
                      onClick={() => onToggleVerify(u._id, `${u.firstName} ${u.lastName}`)}
                      title="Toggle Verification Badge"
                    >
                      <FaUserCheck size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default UserModeration;

