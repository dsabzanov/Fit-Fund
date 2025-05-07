import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Edit, Trash2, Users, TrendingUp, DollarSign, User, Award, Ban, CheckCircle2, AlertCircle, X } from "lucide-react";
import { User as UserType, Challenge, Participant, FeedPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [challengeSearchTerm, setChallengeSearchTerm] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedWeightRecord, setSelectedWeightRecord] = useState<any>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [weightVerificationDialogOpen, setWeightVerificationDialogOpen] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState("");

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Fetch all challenges
  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/admin/challenges"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  // Fetch all participants
  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ["/api/admin/participants"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/participants");
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });
  
  // Fetch pending weight records
  const { data: pendingWeightRecords, isLoading: weightRecordsLoading } = useQuery({
    queryKey: ["/api/admin/weight-records/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/weight-records/pending");
      if (!res.ok) throw new Error("Failed to fetch pending weight records");
      return res.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserType> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userData.id}`, userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserDialogOpen(false);
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update challenge mutation
  const updateChallengeMutation = useMutation({
    mutationFn: async (challengeData: Partial<Challenge> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/challenges/${challengeData.id}`, challengeData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update challenge");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      setChallengeDialogOpen(false);
      toast({
        title: "Challenge updated",
        description: "The challenge has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update participant payment status mutation
  const updateParticipantPaymentMutation = useMutation({
    mutationFn: async ({ userId, challengeId, paid }: { userId: number; challengeId: number; paid: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/participants/${challengeId}/${userId}/payment`, { paid });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update payment status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/participants"] });
      toast({
        title: "Payment status updated",
        description: "The participant's payment status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update payment status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Verify weight record mutation
  const verifyWeightRecordMutation = useMutation({
    mutationFn: async ({ recordId, status, feedback }: { recordId: number; status: "approved" | "rejected"; feedback?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/weight-records/${recordId}/verify`, { status, feedback });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to verify weight record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weight-records/pending"] });
      setWeightVerificationDialogOpen(false);
      setVerificationFeedback("");
      toast({
        title: "Weight record verified",
        description: "The weight record has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to verify weight record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users ? users.filter(user => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  ) : [];

  const filteredChallenges = challenges ? challenges.filter(challenge => 
    challenge.title.toLowerCase().includes(challengeSearchTerm.toLowerCase()) ||
    challenge.description.toLowerCase().includes(challengeSearchTerm.toLowerCase())
  ) : [];

  // Calculate user stats
  const totalUsers = users?.length || 0;
  const totalAdmins = users?.filter(u => u.isAdmin).length || 0;
  const totalHosts = users?.filter(u => u.isHost).length || 0;
  
  // Calculate challenge stats
  const totalChallenges = challenges?.length || 0;
  const activeChallenges = challenges?.filter(c => c.status === "active").length || 0;
  const totalParticipants = participants?.length || 0;
  const paidParticipants = participants?.filter(p => p.paid).length || 0;
  const totalRevenue = participants?.filter(p => p.paid).reduce((sum, p) => {
    const challenge = challenges?.find(c => c.id === p.challengeId);
    return sum + (challenge?.entryFee || 0);
  }, 0) || 0;
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, challenges, and monitor activity across the platform.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {totalAdmins} Admins · {totalHosts} Hosts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeChallenges}</div>
              <p className="text-xs text-muted-foreground">
                of {totalChallenges} total challenges
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                {paidParticipants} paid participants
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across all paid challenges
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="challenges">Challenge Management</TabsTrigger>
            <TabsTrigger value="weight-verification">Weight Verification</TabsTrigger>
          </TabsList>
          
          {/* Weight Verification Tab */}
          <TabsContent value="weight-verification" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Weight Verification</h2>
              <div className="flex items-center gap-2">
                <Badge variant={pendingWeightRecords?.length ? "destructive" : "outline"}>
                  {pendingWeightRecords?.length || 0} Pending
                </Badge>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Challenge</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weightRecordsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="w-10 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-32 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-32 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-16 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-40 h-20" /></TableCell>
                        <TableCell><Skeleton className="w-24 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-20 h-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendingWeightRecords && pendingWeightRecords.length > 0 ? (
                    pendingWeightRecords.map((record) => {
                      const user = users?.find(u => u.id === record.userId);
                      const challenge = challenges?.find(c => c.id === record.challengeId);
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>{user?.username || `User #${record.userId}`}</TableCell>
                          <TableCell>{challenge?.title || `Challenge #${record.challengeId}`}</TableCell>
                          <TableCell>{record.weight} lbs</TableCell>
                          <TableCell>
                            {record.imageUrl ? (
                              <a 
                                href={record.imageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-40 h-20 relative overflow-hidden rounded-md"
                              >
                                <img 
                                  src={record.imageUrl} 
                                  alt="Weight verification" 
                                  className="object-cover w-full h-full"
                                />
                              </a>
                            ) : (
                              <span className="text-muted-foreground italic">No image</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(record.recordedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedWeightRecord(record);
                                  setVerificationFeedback("");
                                  setWeightVerificationDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No weight records pending verification.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Users</h2>
              <div className="w-full max-w-sm">
                <Input 
                  placeholder="Search users..." 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="w-10 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-32 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-40 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-24 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-24 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-20 h-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          {user.isAdmin && (
                            <Badge className="mr-1 bg-purple-500">Admin</Badge>
                          )}
                          {user.isHost && (
                            <Badge className="mr-1">Host</Badge>
                          )}
                          {!user.isAdmin && !user.isHost && (
                            <Badge variant="outline">Player</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        {userSearchTerm ? "No users match your search." : "No users found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Challenges</h2>
              <div className="w-full max-w-sm">
                <Input 
                  placeholder="Search challenges..." 
                  value={challengeSearchTerm}
                  onChange={(e) => setChallengeSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challengesLoading || participantsLoading || usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="w-10 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-40 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-24 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-20 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-16 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-16 h-5" /></TableCell>
                        <TableCell><Skeleton className="w-20 h-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredChallenges.length > 0 ? (
                    filteredChallenges.map((challenge) => {
                      // Find host user
                      const host = users?.find(u => u.id === challenge.userId);
                      
                      // Find participants for this challenge
                      const challengeParticipants = participants?.filter(p => p.challengeId === challenge.id) || [];
                      const paidCount = challengeParticipants.filter(p => p.paid).length;
                      
                      return (
                        <TableRow key={challenge.id}>
                          <TableCell>{challenge.id}</TableCell>
                          <TableCell className="font-medium">{challenge.title}</TableCell>
                          <TableCell>{host?.username || "Unknown"}</TableCell>
                          <TableCell>
                            {challenge.status === "active" ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : challenge.status === "completed" ? (
                              <Badge className="bg-blue-500">Completed</Badge>
                            ) : challenge.status === "pending" ? (
                              <Badge className="bg-yellow-500">Pending</Badge>
                            ) : (
                              <Badge variant="outline">{challenge.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {paidCount}/{challengeParticipants.length}
                          </TableCell>
                          <TableCell>${challenge.entryFee}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedChallenge(challenge);
                                setChallengeDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        {challengeSearchTerm ? "No challenges match your search." : "No challenges found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedUser) return;
                
                const formData = new FormData(e.currentTarget);
                const isAdmin = formData.get("isAdmin") === "on";
                const isHost = formData.get("isHost") === "on";
                const email = formData.get("email") as string;
                
                updateUserMutation.mutate({
                  id: selectedUser.id,
                  email: email || null,
                  isAdmin,
                  isHost
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={selectedUser.username}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedUser.email || ""}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    defaultChecked={selectedUser.isAdmin}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isAdmin" className="text-sm font-medium leading-none">
                    Admin User
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isHost"
                    name="isHost"
                    defaultChecked={selectedUser.isHost}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isHost" className="text-sm font-medium leading-none">
                    Host User
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>
              Update challenge details and manage participants.
            </DialogDescription>
          </DialogHeader>
          {selectedChallenge && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedChallenge) return;
                
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const description = formData.get("description") as string;
                const entryFee = parseFloat(formData.get("entryFee") as string);
                const percentageGoal = parseFloat(formData.get("percentageGoal") as string);
                const status = formData.get("status") as string;
                
                // startDate and endDate handling
                const startDateStr = formData.get("startDate") as string;
                const endDateStr = formData.get("endDate") as string;
                
                updateChallengeMutation.mutate({
                  id: selectedChallenge.id,
                  title,
                  description,
                  entryFee,
                  percentageGoal: percentageGoal.toString(),
                  status,
                  startDate: startDateStr ? new Date(startDateStr) : selectedChallenge.startDate,
                  endDate: endDateStr ? new Date(endDateStr) : selectedChallenge.endDate
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedChallenge.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedChallenge.description}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">Entry Fee ($)</Label>
                    <Input
                      id="entryFee"
                      name="entryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={selectedChallenge.entryFee}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentageGoal">Weight Loss Goal (%)</Label>
                    <Input
                      id="percentageGoal"
                      name="percentageGoal"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={selectedChallenge.percentageGoal}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={selectedChallenge.status}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={selectedChallenge.startDate.toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={selectedChallenge.endDate.toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Challenge Participants */}
              {participants && challenges && users && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Participants</h3>
                  <div className="rounded-md border max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Start Weight</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants
                          .filter(p => p.challengeId === selectedChallenge.id)
                          .map(participant => {
                            const participantUser = users.find(u => u.id === participant.userId);
                            return (
                              <TableRow key={`${participant.userId}-${participant.challengeId}`}>
                                <TableCell>{participantUser?.username || "Unknown"}</TableCell>
                                <TableCell>{participant.startWeight} lbs</TableCell>
                                <TableCell>{participant.currentWeight || "-"} lbs</TableCell>
                                <TableCell>
                                  {participant.paid ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">Paid</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100">Unpaid</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateParticipantPaymentMutation.mutate({
                                      userId: participant.userId,
                                      challengeId: participant.challengeId,
                                      paid: !participant.paid
                                    })}
                                    disabled={updateParticipantPaymentMutation.isPending}
                                  >
                                    {participant.paid ? "Mark Unpaid" : "Mark Paid"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {participants.filter(p => p.challengeId === selectedChallenge.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-2 text-muted-foreground">
                              No participants yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setChallengeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateChallengeMutation.isPending}>
                  {updateChallengeMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Weight Verification Dialog */}
      <Dialog open={weightVerificationDialogOpen} onOpenChange={setWeightVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Weight Record</DialogTitle>
            <DialogDescription>
              Review the weight submission and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          
          {selectedWeightRecord && (
            <div className="space-y-4">
              {/* Weight record details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">User:</span>
                  <span>{users?.find(u => u.id === selectedWeightRecord.userId)?.username || `User #${selectedWeightRecord.userId}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Challenge:</span>
                  <span>{challenges?.find(c => c.id === selectedWeightRecord.challengeId)?.title || `Challenge #${selectedWeightRecord.challengeId}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Weight:</span>
                  <span>{selectedWeightRecord.weight} lbs</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(selectedWeightRecord.recordedAt).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Display image if available */}
              {selectedWeightRecord.imageUrl && (
                <div className="mt-4">
                  <Label className="block mb-2">Verification Image</Label>
                  <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={selectedWeightRecord.imageUrl} 
                      alt="Weight verification" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Feedback input */}
              <div className="mt-4">
                <Label htmlFor="verification-feedback">Feedback (optional)</Label>
                <Textarea
                  id="verification-feedback"
                  placeholder="Leave feedback for the user..."
                  value={verificationFeedback}
                  onChange={(e) => setVerificationFeedback(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your feedback will be visible to the user.
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setWeightVerificationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    verifyWeightRecordMutation.mutate({
                      recordId: selectedWeightRecord.id,
                      status: "rejected",
                      feedback: verificationFeedback
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    verifyWeightRecordMutation.mutate({
                      recordId: selectedWeightRecord.id,
                      status: "approved",
                      feedback: verificationFeedback
                    });
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}