import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Search, Filter, DownloadCloud, Settings, Edit, Save, XCircle, CheckCircle, Calendar, Mail } from "lucide-react";
import { Footer } from "@/components/footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User as UserType, Challenge, Participant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("users");
  
  // Filter states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [challengeSearchTerm, setChallengeSearchTerm] = useState("");
  
  // Edit states
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  
  // Fetch data
  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin === true // Only fetch if user is admin
  });
  
  const { 
    data: challenges = [], 
    isLoading: isLoadingChallenges, 
    error: challengesError 
  } = useQuery<Challenge[]>({
    queryKey: ["/api/admin/challenges"],
    enabled: user?.isAdmin === true // Only fetch if user is admin
  });
  
  const { 
    data: participants = [], 
    isLoading: isLoadingParticipants, 
    error: participantsError 
  } = useQuery<Participant[]>({
    queryKey: ["/api/admin/participants"],
    enabled: user?.isAdmin === true // Only fetch if user is admin
  });
  
  // Update mutations
  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: UserType) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${updatedUser.id}`, updatedUser);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user.",
        variant: "destructive",
      });
    },
  });
  
  const updateChallengeMutation = useMutation({
    mutationFn: async (updatedChallenge: Challenge) => {
      const response = await apiRequest("PATCH", `/api/admin/challenges/${updatedChallenge.id}`, updatedChallenge);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Challenge Updated",
        description: "Challenge information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      setEditingChallenge(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update challenge.",
        variant: "destructive",
      });
    },
  });
  
  // Filtered data
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );
  
  const filteredChallenges = challenges.filter(challenge => 
    challenge.title.toLowerCase().includes(challengeSearchTerm.toLowerCase()) ||
    challenge.description.toLowerCase().includes(challengeSearchTerm.toLowerCase())
  );
  
  // Check if user has admin access
  useEffect(() => {
    if (user && user.isAdmin !== true) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);
  
  // Handle user edit submission
  const handleUserUpdate = (updatedUser: UserType) => {
    updateUserMutation.mutate(updatedUser);
  };
  
  // Handle challenge edit submission
  const handleChallengeUpdate = (updatedChallenge: Challenge) => {
    updateChallengeMutation.mutate(updatedChallenge);
  };
  
  // Export data as CSV
  const exportUsersCSV = () => {
    const headers = ["ID", "Username", "Email", "Created At", "Status"];
    const csvData = [
      headers.join(","),
      ...users.map(user => 
        [
          user.id, 
          user.username, 
          user.email || "N/A", 
          new Date(user.createdAt || Date.now()).toLocaleDateString(), 
          user.isAdmin ? "Admin" : "User"
        ].join(",")
      )
    ].join("\\n");
    
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const exportChallengesCSV = () => {
    const headers = ["ID", "Title", "Description", "Start Date", "End Date", "Entry Fee", "Status", "Creator"];
    const csvData = [
      headers.join(","),
      ...challenges.map(challenge => 
        [
          challenge.id, 
          challenge.title, 
          challenge.description.replace(/,/g, ";"), 
          new Date(challenge.startDate).toLocaleDateString(), 
          new Date(challenge.endDate).toLocaleDateString(), 
          challenge.entryFee,
          challenge.status,
          challenge.userId
        ].join(",")
      )
    ].join("\\n");
    
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "challenges_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Loading and error states
  if (isLoadingUsers || isLoadingChallenges || isLoadingParticipants) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (usersError || challengesError || participantsError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading admin data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Check admin access one more time
  if (!user || user.isAdmin !== true) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary/10 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, challenges, and more</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                Back to App
              </Button>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Logged in as:</span> {user.username}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" className="text-lg">
              <User className="h-4 w-4 mr-2" />
              Users Management
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-lg">
              <Calendar className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-lg">
              <Settings className="h-4 w-4 mr-2" />
              Admin Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all registered users on the platform.
                </CardDescription>
                <div className="flex justify-between items-center mt-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 max-w-sm"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportUsersCSV}>
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString() 
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.isAdmin 
                                ? "bg-primary/20 text-primary" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {user.isAdmin ? "Admin" : "Active"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>
                                    Update user information and settings.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Username</label>
                                    <Input
                                      defaultValue={user.username}
                                      className="col-span-3"
                                      onChange={(e) => setEditingUser({
                                        ...user,
                                        username: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Email</label>
                                    <Input
                                      defaultValue={user.email || ""}
                                      className="col-span-3"
                                      onChange={(e) => setEditingUser({
                                        ...user,
                                        email: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Admin Access</label>
                                    <div className="col-span-3 flex items-center">
                                      <input 
                                        type="checkbox" 
                                        className="mr-2"
                                        defaultChecked={user.isAdmin}
                                        onChange={(e) => setEditingUser({
                                          ...user,
                                          isAdmin: e.target.checked
                                        })}
                                      />
                                      <span>Grant admin privileges</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleUserUpdate(editingUser || user)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No users found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>
                  Key statistics about user engagement and activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Total Users</h3>
                    <p className="text-3xl font-bold">{users.length}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Across all FitFund challenges
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Active Users</h3>
                    <p className="text-3xl font-bold">
                      {participants.filter(p => p.active).length}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Currently participating in challenges
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Conversion Rate</h3>
                    <p className="text-3xl font-bold">
                      {users.length > 0 
                        ? `${Math.round((participants.length / users.length) * 100)}%`
                        : "0%"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Users who joined at least one challenge
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader>
                <CardTitle>All Challenges</CardTitle>
                <CardDescription>
                  View and manage all FitFund challenges.
                </CardDescription>
                <div className="flex justify-between items-center mt-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search challenges..."
                      className="pl-8 max-w-sm"
                      value={challengeSearchTerm}
                      onChange={(e) => setChallengeSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportChallengesCSV}>
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Entry Fee</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChallenges.length > 0 ? (
                      filteredChallenges.map((challenge) => (
                        <TableRow key={challenge.id}>
                          <TableCell>{challenge.id}</TableCell>
                          <TableCell className="font-medium">{challenge.title}</TableCell>
                          <TableCell>{new Date(challenge.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(challenge.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              challenge.status === 'open'
                                ? "bg-green-100 text-green-800"
                                : challenge.status === 'ongoing'
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {participants.filter(p => p.challengeId === challenge.id).length}
                          </TableCell>
                          <TableCell>${challenge.entryFee}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit Challenge</DialogTitle>
                                  <DialogDescription>
                                    Update challenge details and settings.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Title</label>
                                    <Input
                                      defaultValue={challenge.title}
                                      className="col-span-3"
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        title: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Description</label>
                                    <textarea
                                      className="col-span-3 min-h-[100px] p-2 border rounded-md"
                                      defaultValue={challenge.description}
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        description: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Start Date</label>
                                    <Input
                                      type="date"
                                      defaultValue={new Date(challenge.startDate).toISOString().split('T')[0]}
                                      className="col-span-3"
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        startDate: new Date(e.target.value).toISOString()
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">End Date</label>
                                    <Input
                                      type="date"
                                      defaultValue={new Date(challenge.endDate).toISOString().split('T')[0]}
                                      className="col-span-3"
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        endDate: new Date(e.target.value).toISOString()
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Entry Fee</label>
                                    <Input
                                      type="number"
                                      defaultValue={challenge.entryFee}
                                      className="col-span-3"
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        entryFee: parseInt(e.target.value)
                                      })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right">Status</label>
                                    <select
                                      defaultValue={challenge.status}
                                      className="col-span-3 p-2 border rounded-md"
                                      onChange={(e) => setEditingChallenge({
                                        ...challenge,
                                        status: e.target.value
                                      })}
                                    >
                                      <option value="open">Open</option>
                                      <option value="ongoing">Ongoing</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingChallenge(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleChallengeUpdate(editingChallenge || challenge)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/challenge/${challenge.id}`} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No challenges found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredChallenges.length} of {challenges.length} challenges
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Challenge Analytics</CardTitle>
                <CardDescription>
                  Key statistics about challenges and participation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Total Challenges</h3>
                    <p className="text-3xl font-bold">{challenges.length}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Created on the platform
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Active Challenges</h3>
                    <p className="text-3xl font-bold">
                      {challenges.filter(c => c.status === 'ongoing').length}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Currently running
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold">
                      ${participants.reduce((sum, p) => {
                        const challenge = challenges.find(c => c.id === p.challengeId);
                        return sum + (challenge?.entryFee || 0);
                      }, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      From all entry fees
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Configure global settings and preferences for the admin dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Email Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span>New user registrations</span>
                        </label>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span>New challenge creations</span>
                        </label>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span>Payment processing events</span>
                        </label>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Data Management</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Export all platform data for backup or analysis.
                        </p>
                        <Button variant="outline">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Export All Data
                        </Button>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Database maintenance and optimization.
                        </p>
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Database Tools
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">System Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Platform Version</p>
                        <p className="text-muted-foreground">FitFund v1.0.0</p>
                      </div>
                      <div>
                        <p className="font-medium">Database Status</p>
                        <p className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Connected
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Last Backup</p>
                        <p className="text-muted-foreground">Never</p>
                      </div>
                      <div>
                        <p className="font-medium">Server Time</p>
                        <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}