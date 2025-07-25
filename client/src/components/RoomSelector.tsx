import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, MapPin, Filter, Check, Phone, Monitor, Projector, Mic, Camera, Clipboard } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  capacity: number;
  description: string;
  equipment: string[];
  available: boolean;
  conflictReason: string | null;
}

interface RoomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onSelect: (roomId: string) => void;
  selectedRoomId?: string;
  hideUnavailable?: boolean;
}

const getEquipmentIcon = (equipment: string) => {
  switch (equipment.toLowerCase()) {
    case 'telephone':
    case 'phone':
      return <Phone className="w-3 h-3" />;
    case 'tv':
    case 'monitor':
      return <Monitor className="w-3 h-3" />;
    case 'projector':
      return <Projector className="w-3 h-3" />;
    case 'mic':
    case 'microphone':
    case 'mic & speaker':
      return <Mic className="w-3 h-3" />;
    case 'camera':
      return <Camera className="w-3 h-3" />;
    case 'whiteboard':
      return <Clipboard className="w-3 h-3" />;
    default:
      return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  }
};

export default function RoomSelector({ isOpen, onClose, rooms, onSelect, selectedRoomId, hideUnavailable = false }: RoomSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  const availableRooms = rooms.filter(room => room.available);
  const unavailableRooms = rooms.filter(room => !room.available);
  
  // Always show all rooms in "All rooms" tab, regardless of hideUnavailable setting
  const hasAvailabilityData = rooms.some(room => room.hasOwnProperty('available'));
  


  const filterRooms = (roomsList: Room[]) => {
    if (!searchTerm) return roomsList;
    return roomsList.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAvailableRooms = filterRooms(availableRooms);
  const filteredUnavailableRooms = filterRooms(unavailableRooms);

  const handleRoomSelect = (room: Room) => {
    if (room.available) {
      onSelect(room.id.toString());
      onClose();
    }
  };

  const selectedRoom = rooms.find(r => r.id.toString() === selectedRoomId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Add rooms</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Select a room for your booking. Available rooms are shown with green indicators.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="available" className="flex items-center space-x-2">
                  <span>Available rooms</span>
                  {availableRooms.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                      {filteredAvailableRooms.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center space-x-2">
                  <span>All rooms</span>
                  <Badge variant="secondary" className="ml-1">
                    {filterRooms(rooms).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>

            {/* Selected Room Display */}
            {selectedRoom && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">{selectedRoom.name}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-300 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{selectedRoom.capacity}</span>
                        <span>•</span>
                        <span>{selectedRoom.description || 'Meeting Room'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="available" className="h-full overflow-y-auto space-y-2 mt-2">
                {filteredAvailableRooms.length > 0 ? (
                  filteredAvailableRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleRoomSelect(room)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedRoomId === room.id.toString() 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{room.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-3 mb-1">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{room.capacity}</span>
                              </div>
                              <span>•</span>
                              <span>{room.description || 'Meeting Room'}</span>
                            </div>
                            {room.equipment && room.equipment.length > 0 && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs">Facilities:</span>
                                <div className="flex items-center space-x-1">
                                  {room.equipment.slice(0, 4).map((eq, index) => (
                                    <div key={index} className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                      {getEquipmentIcon(eq)}
                                      <span className="text-xs">{eq}</span>
                                    </div>
                                  ))}
                                  {room.equipment.length > 4 && (
                                    <span className="text-xs text-gray-400">+{room.equipment.length - 4} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div className="font-medium">No available rooms found</div>
                    <div className="text-sm">Try selecting a different time slot</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="h-full overflow-y-auto space-y-2 mt-2">
                {filterRooms(rooms).length > 0 ? (
                  filterRooms(rooms).map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleRoomSelect(room)}
                      className={`p-4 border rounded-lg transition-all ${
                        room.available 
                          ? `cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              selectedRoomId === room.id.toString() 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700'
                            }`
                          : 'cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <MapPin className={`w-5 h-5 ${room.available ? 'text-gray-600 dark:text-gray-400' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium ${room.available ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {room.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-3 mb-1">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{room.capacity}</span>
                              </div>
                              <span>•</span>
                              <span>{room.description || 'Meeting Room'}</span>
                            </div>
                            {room.equipment && room.equipment.length > 0 && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs">Facilities:</span>
                                <div className="flex items-center space-x-1">
                                  {room.equipment.slice(0, 4).map((eq, index) => (
                                    <div key={index} className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                      {getEquipmentIcon(eq)}
                                      <span className="text-xs">{eq}</span>
                                    </div>
                                  ))}
                                  {room.equipment.length > 4 && (
                                    <span className="text-xs text-gray-400">+{room.equipment.length - 4} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 ${room.available ? 'text-green-600' : 'text-red-600'}`}>
                          <div className={`w-2 h-2 rounded-full ${room.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-medium">
                            {room.available ? 'Available' : 'Already Booked'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div className="font-medium">No rooms found</div>
                    <div className="text-sm">Try adjusting your search criteria</div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}