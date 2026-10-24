export type Message = { id: number; text: string; mine: boolean; time: string };
export type Chat = {
  id: number; name: string; avatar: string; online: boolean;
  lastMessage: string; time: string; unread: number; messages: Message[];
};

export const initialChats: Chat[] = [
  { id: 1, name: "Sophia Williams", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces", online: true, lastMessage: "See you tomorrow! 😊", time: "09:41", unread: 2, messages: [
    { id: 1, text: "Hey! How are you?", mine: false, time: "09:35" },
    { id: 2, text: "I'm good! How about you?", mine: true, time: "09:37" },
    { id: 3, text: "Doing great, thanks!", mine: false, time: "09:39" },
    { id: 4, text: "See you tomorrow! 😊", mine: false, time: "09:41" }
  ]},
  { id: 2, name: "James Anderson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces", online: true, lastMessage: "That sounds amazing!", time: "09:28", unread: 1, messages: [
    { id: 1, text: "Are we still meeting today?", mine: false, time: "09:20" },
    { id: 2, text: "Yes, absolutely!", mine: true, time: "09:25" },
    { id: 3, text: "That sounds amazing!", mine: false, time: "09:28" }
  ]},
  { id: 3, name: "Olivia Martinez", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces", online: false, lastMessage: "Thank you so much ❤️", time: "Yesterday", unread: 0, messages: [
    { id: 1, text: "I sent you the photos.", mine: true, time: "18:12" },
    { id: 2, text: "Thank you so much ❤️", mine: false, time: "18:16" }
  ]},
  { id: 4, name: "Daniel Brown", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces", online: false, lastMessage: "Let's talk later.", time: "Yesterday", unread: 0, messages: [
    { id: 1, text: "Are you free this evening?", mine: true, time: "16:02" },
    { id: 2, text: "Let's talk later.", mine: false, time: "16:10" }
  ]},
  { id: 5, name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=faces", online: true, lastMessage: "Good morning! ☀️", time: "08:52", unread: 0, messages: [
    { id: 1, text: "Good morning! ☀️", mine: false, time: "08:52" }
  ]},
  { id: 6, name: "Noah Taylor", avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=160&h=160&fit=crop&crop=faces", online: false, lastMessage: "Got it, thanks.", time: "Monday", unread: 0, messages: [
    { id: 1, text: "I sent the document.", mine: true, time: "14:20" },
    { id: 2, text: "Got it, thanks.", mine: false, time: "14:25" }
  ]}
];
