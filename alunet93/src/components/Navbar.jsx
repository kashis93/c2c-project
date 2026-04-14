import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealTime } from '@/contexts/RealTimeContext';
import { Users, Home, Search, MessageCircle, Bell, LogOut, User as UserIcon, Menu, X, Briefcase, Target, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import ldceLogo from '@/data/assets/images/events/LDCE_Logo.png';
import api from "@/services/axios";
import { toast } from 'sonner';

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Sound not available');
  }
};

const Navbar = () => {
  const { alumni, logout, isLoggedIn } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { socket } = useRealTime();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [globalQ, setGlobalQ] = React.useState("");
  const [globalOpen, setGlobalOpen] = React.useState(false);
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [globalResults, setGlobalResults] = React.useState([]);
  const [unreadChats, setUnreadChats] = React.useState(0);
  const searchBoxRef = React.useRef(null);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Directory', path: '/directory', icon: Users },
    { name: 'Feed', path: '/feed', icon: MessageCircle },
    { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { name: 'Challenges', path: '/challenges', icon: Target },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Innovation', path: '/innovation', icon: Zap },
  ];

  React.useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnreadChats = async () => {
      try {
        const response = await api.get('/chats');
        const chats = Array.isArray(response.data?.data) ? response.data.data : [];
        const unreadCount = chats.filter(chat => chat.unreadCount > 0).length;
        setUnreadChats(unreadCount);
      } catch (error) {
        console.log('Could not fetch chat count');
      }
    };
    fetchUnreadChats();
  }, [isLoggedIn]);

  React.useEffect(() => {
    if (!socket || !isLoggedIn) return;
    socket.on('new-message', (data) => {
      console.log('Message:', data);
      playNotificationSound();
      setUnreadChats(prev => prev + 1);
      toast.success(`Message from ${data.senderName}`, { description: data.messagePreview, duration: 4000 });
    });
    socket.on('new-notification', (notification) => {
      console.log('Notification:', notification);
      playNotificationSound();
      toast.success(notification.message || 'New notification', { duration: 4000 });
    });
    socket.on('connection-request', (data) => {
      console.log('Request:', data);
      playNotificationSound();
      toast.success(`${data.senderName} sent a connection request`, { duration: 5000 });
    });
    return () => {
      socket.off('new-message');
      socket.off('new-notification');
      socket.off('connection-request');
    };
  }, [socket, isLoggedIn]);

  React.useEffect(() => {
    const term = globalQ.trim();
    if (!globalOpen) return;
    if (term.length < 2) {
      setGlobalResults([]);
      setGlobalLoading(false);
      return;
    }
    setGlobalLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/search", { params: { q: term, limit: 6 } });
        setGlobalResults(Array.isArray(res.data?.results) ? res.data.results : []);
      } catch {
        setGlobalResults([]);
      } finally {
        setGlobalLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [globalQ, globalOpen]);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target)) setGlobalOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full z-50 sticky top-0 bg-gradient-to-r from-orange-600/80 via-amber-600/80 to-orange-600/80 backdrop-blur-md shadow-2xl border-b border-orange-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="h-11 w-11 bg-white rounded-lg flex items-center justify-center shadow-md">
              <img src={ldceLogo} alt="LDCE" className="h-9 w-9 object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-bold text-white leading-tight">LDCE Alumni</p>
              <p className="text-xs font-medium text-amber-100 uppercase tracking-wider">AluVerse</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
              return (
                <Link key={link.path} to={link.path} className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-1.5 ${isActive ? 'text-orange-900 bg-white shadow-lg' : 'text-amber-50 hover:text-white hover:bg-orange-700/50'}`}>
                  <link.icon size={15} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex flex-1 justify-center max-w-md" ref={searchBoxRef}>
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
              <input value={globalQ} onChange={(e) => { setGlobalQ(e.target.value); setGlobalOpen(true); }} onFocus={() => setGlobalOpen(true)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const term = globalQ.trim(); if (term.length >= 2) { setGlobalOpen(false); navigate(`/search?q=${encodeURIComponent(term)}`); } } if (e.key === "Escape") setGlobalOpen(false); }} placeholder="Search..." className="h-8 w-full bg-white bg-opacity-90 border border-orange-300 rounded-full pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40 focus:outline-none transition-all" />
              {globalOpen && (globalQ.trim().length >= 2) && (
                <div className="absolute top-8 left-0 right-0 bg-white border border-orange-200 rounded-xl shadow-xl overflow-hidden z-[250]">
                  <div className="px-3 py-2 border-b bg-orange-50">
                    <p className="text-xs font-semibold text-orange-700">Results</p>
                  </div>
                  {globalLoading ? (
                    <div className="px-3 py-4 text-xs text-slate-500">Searching</div>
                  ) : globalResults.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-slate-500">No matches</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {globalResults.map((r) => (
                        <button key={`${r.type}-${r.id}`} type="button" onClick={() => { setGlobalOpen(false); navigate(r.route, { state: r.state }); }} className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold uppercase">{String(r.type || "").slice(0, 1)}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{r.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="md:hidden">
              <button type="button" onClick={() => navigate("/search")} className="p-2 text-white hover:bg-white/15 rounded-lg transition-all">
                <Search size={20} />
              </button>
            </div>

            {isLoggedIn ? (
              <>
                <button className="p-2 text-white hover:bg-white/15 rounded-lg transition-all relative" onClick={() => navigate('/notifications')}>
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                <button className="p-2 text-white hover:bg-white/15 rounded-lg transition-all relative" onClick={() => navigate('/chat')}>
                  <MessageCircle size={20} />
                  {unreadChats > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadChats > 99 ? '99+' : unreadChats}
                    </span>
                  )}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 w-11 rounded-lg p-0 overflow-hidden border border-white/30 hover:border-white/50 hover:bg-white/15 transition-all">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={alumni?.profilePhoto} />
                        <AvatarFallback className="bg-orange-500 text-white font-bold text-sm">
                          {alumni?.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 bg-white rounded-xl shadow-xl border border-orange-200 p-0 z-[200]" align="end">
                    <DropdownMenuLabel className="p-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-t-xl border-b border-orange-500">
                      <p className="text-sm font-bold text-white">{alumni?.name}</p>
                      <p className="text-xs text-amber-100 truncate">{alumni?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="m-0" />
                    <div className="p-1.5 space-y-0.5">
                      <DropdownMenuItem className="p-2 cursor-pointer font-medium gap-2 rounded-lg hover:bg-orange-50 text-sm" onClick={() => navigate('/profile/me')}>
                        <UserIcon size={14} className="text-orange-600" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="p-2 cursor-pointer font-medium gap-2 rounded-lg hover:bg-orange-50 text-sm" onClick={() => navigate('/my-connections')}>
                        <Users size={14} className="text-orange-500" /> Connections
                      </DropdownMenuItem>
                      <DropdownMenuItem className="p-2 cursor-pointer font-medium gap-2 rounded-lg hover:bg-orange-50 text-sm" onClick={() => navigate('/my-activity')}>
                        <TrendingUp size={14} className="text-orange-500" /> Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem className="p-2 cursor-pointer font-medium gap-2 rounded-lg hover:bg-orange-50 text-sm" onClick={() => navigate('/notifications')}>
                        <Bell size={14} className="text-orange-500" /> Notifications
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem className="p-2 text-red-600 cursor-pointer font-medium gap-2 rounded-b-xl hover:bg-red-50 m-1 text-sm" onClick={handleLogout}>
                      <LogOut size={14} /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button className="lg:hidden p-2 text-white hover:bg-white/15 rounded-lg transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-amber-50 text-xs font-semibold hover:bg-orange-700/30 hover:text-white h-8 px-3" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-xs h-8 px-3 shadow-md transition-all" onClick={() => navigate('/signup')}>
                  Join
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-orange-700 border-t border-orange-600 p-2 space-y-0.5">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 p-2.5 text-white hover:bg-white/15 rounded-lg font-medium text-sm">
              <link.icon size={16} />
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;