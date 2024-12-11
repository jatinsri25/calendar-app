import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';

const App = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState({});
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEvents, setFilteredEvents] = useState({});
    const [currentEvent, setCurrentEvent] = useState({
        title: '',
        startTime: '',
        endTime: '',
        description: '',
        color: '#3b82f6'
    });
    const [editingEvent, setEditingEvent] = useState(null);

    // Load events from localStorage on component mount
    useEffect(() => {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            setEvents(JSON.parse(savedEvents));
        }
    }, []);

    // Save events to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }, [events]);

    // Update filtered events when search term or events change
    useEffect(() => {
        if (searchTerm) {
            const filtered = Object.fromEntries(
                Object.entries(events).map(([date, dayEvents]) => [
                    date,
                    dayEvents.filter(event =>
                        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                ]).filter(([, dayEvents]) => dayEvents.length > 0)
            );
            setFilteredEvents(filtered);
        } else {
            setFilteredEvents(events);
        }
    }, [events, searchTerm]);

    const formatDateKey = (date) => {
        return date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : '';
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!selectedDate) return;

        const dateKey = formatDateKey(selectedDate);
        const existingEvents = events[dateKey] || [];

        if (editingEvent) {
            setEvents(prev => ({
                ...prev,
                [dateKey]: prev[dateKey].map(event =>
                    event === editingEvent ? currentEvent : event
                )
            }));
        } else {
            setEvents(prev => ({
                ...prev,
                [dateKey]: [...(prev[dateKey] || []), currentEvent]
            }));
        }

        setShowEventDialog(false);
        setCurrentEvent({
            title: '',
            startTime: '',
            endTime: '',
            description: '',
            color: '#3b82f6'
        });
        setEditingEvent(null);
    };

    const handleDeleteEvent = (eventToDelete) => {
        const dateKey = formatDateKey(selectedDate);
        setEvents(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].filter(event => event !== eventToDelete)
        }));
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const renderCalendarGrid = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = formatDateKey(date);
            const dayEvents = filteredEvents[dateKey] || [];
            const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            days.push(
                <div
                    key={day}
                    onClick={() => {
                        setSelectedDate(date);
                        setShowEventDialog(true);
                    }}
                    className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 overflow-hidden
            ${isToday(date) ? 'bg-blue-50' : ''}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
            ${isWeekend ? 'bg-gray-50' : ''}
          `}
                >
                    <span className={`text-sm ${isToday(date) ? 'font-bold text-blue-600' : ''}`}>
                        {day}
                    </span>
                    {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs truncate rounded px-1"
                                    style={{
                                        backgroundColor: `${event.color}20`,
                                        color: event.color
                                    }}
                                >
                                    {event.title}
                                </div>
                            ))}
                            {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-500">
                                    +{dayEvents.length - 2} more
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Search events..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => exportEvents('json')}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export JSON
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => exportEvents('csv')}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 flex justify-between items-center border-b">
                        <h2 className="text-xl font-semibold">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-0">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center p-2 font-medium border border-gray-200 bg-gray-50">
                                {day}
                            </div>
                        ))}
                        {renderCalendarGrid()}
                    </div>
                </div>

                <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedDate?.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Event Form */}
                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Event Title</label>
                                <Input
                                    value={currentEvent.title}
                                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Time</label>
                                    <Input
                                        type="time"
                                        value={currentEvent.startTime}
                                        onChange={(e) => setCurrentEvent(prev => ({ ...prev, startTime: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Time</label>
                                    <Input
                                        type="time"
                                        value={currentEvent.endTime}
                                        onChange={(e) => setCurrentEvent(prev => ({ ...prev, endTime: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                <Textarea
                                    value={currentEvent.description}
                                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Color</label>
                                <Input
                                    type="color"
                                    value={currentEvent.color}
                                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, color: e.target.value }))}
                                    className="h-10 w-20"
                                />
                            </div>

                            <DialogFooter>
                                {editingEvent && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => {
                                            handleDeleteEvent(editingEvent);
                                            setShowEventDialog(false);
                                        }}
                                        className="mr-auto"
                                    >
                                        Delete Event
                                    </Button>
                                )}
                                <Button type="submit">
                                    {editingEvent ? 'Update Event' : 'Add Event'}
                                </Button>
                            </DialogFooter>
                        </form>

                        {/* Event List */}
                        {selectedDate && (
                            <div className="mt-6">
                                <h3 className="font-medium mb-2">Events for this day:</h3>
                                <div className="space-y-2">
                                    {(events[formatDateKey(selectedDate)] || []).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 rounded border cursor-pointer hover:bg-gray-50"
                                            style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                                            onClick={() => {
                                                setCurrentEvent(event);
                                                setEditingEvent(event);
                                            }}
                                        >
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-sm text-gray-600">
                                                {event.startTime} - {event.endTime}
                                            </div>
                                            {event.description && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {event.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default App;