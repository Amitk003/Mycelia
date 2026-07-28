# Use Cases

## Community Gardens

A community garden has multiple plots managed by different people. Each person opens Mycelia on their phone while in the garden. The cells sense local light, sound, and motion. They share information through the peer-to-peer mesh. Over time, the network learns the garden's patterns: which areas get morning shade, where soil dries faster, when birds are most active.

The organism proposes actions like adjusting watering schedules, adding compost, or planting nitrogen-fixers next to heavy feeders. Gardeners accept or reject proposals. The whole network benefits from each person's feedback.

## School Gardening Programs

A classroom has a few potted plants near a window. Students open Mycelia on a tablet and leave it running. The cells track light changes through the day and weather patterns. Students see proposals about when to water, when to rotate plants, or when to start seedlings indoors.

The proposal confidence scores teach students about evidence-based decisions. The evolving genome demonstrates evolution concepts in a tangible way.

## Balcony and Urban Gardening

Apartment dwellers with limited outdoor space can run Mycelia on a laptop near their plants. The organism adapts to the specific microclimate of that balcony: reflected heat from buildings, wind patterns between structures, limited direct sunlight hours.

Proposals focus on container plant combinations, watering frequency adjustments, and seasonal transition timing.

## How it differs from existing solutions

- No cloud AI or training data required. Everything runs locally in the browser.
- Privacy first. Sensor data never leaves the device.
- The system improves with use. More feedback means better proposals.
- Works offline after initial load. The core loop does not need internet.
- Multiple devices make the whole network smarter without central coordination.

## Limitations

- Current sensors (camera light, ambient audio, device motion) are proxies. They do not replace soil moisture sensors or weather stations.
- The action proposals are templates. They are not specific to any plant species or soil type without user tuning.
- The P2P mesh requires a signaling server for initial connection. After that, peers communicate directly.
- The system learns from feedback but does not have a pre-trained model. Initial proposals may be low confidence until the network accumulates experience.
