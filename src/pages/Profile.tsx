import { UserProfileComponent } from '../components/UserProfile';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <UserProfileComponent />
      </div>
    </div>
  );
};

export default Profile;